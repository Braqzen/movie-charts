use crate::{
    Database,
    entities::{
        genres,
        movies::{ActiveModel, Column, Model},
        prelude::{Genres, Movies},
    },
};
use eyre::Result;
use sea_orm::{
    ActiveValue::Set,
    ColumnTrait, Condition, EntityTrait, QueryFilter,
    sea_query::{Expr, extension::postgres::PgBinOper, extension::postgres::PgExpr},
};
use std::collections::{HashMap, HashSet};

#[derive(Clone, Debug)]
pub struct MovieWithGenres {
    pub id: i32,
    pub title: String,
    pub genres: Vec<String>,
}

#[derive(Clone, Debug)]
pub struct MovieRecommendation {
    pub id: i32,
    pub title: String,
    pub genres: Vec<String>,
    pub match_count: i32,
}

impl Database {
    pub async fn insert_movie(&self, id: i32, title: String, genres: Vec<i32>) -> Result<()> {
        Movies::insert(ActiveModel {
            id: Set(id),
            title: Set(title),
            genres: Set(genres),
        })
        .exec(&self.connection)
        .await?;

        Ok(())
    }

    /// Get a movie by its ID
    pub async fn movie(&self, id: i32) -> Result<Option<Model>> {
        Ok(Movies::find_by_id(id).one(&self.connection).await?)
    }

    pub async fn search_movies(&self, query: &str) -> Result<Vec<MovieWithGenres>> {
        let movies = Movies::find()
            .filter(Expr::col(Column::Title).ilike(format!("%{}%", query)))
            .all(&self.connection)
            .await?;

        let genre_ids = movies
            .iter()
            .flat_map(|movie| movie.genres.iter().copied())
            .collect::<Vec<_>>();

        let genres = Genres::find()
            .filter(genres::Column::Id.is_in(genre_ids))
            .all(&self.connection)
            .await?
            .into_iter()
            .map(|genre| (genre.id, genre.title))
            .collect::<HashMap<_, _>>();

        Ok(movies
            .into_iter()
            .map(|movie| MovieWithGenres {
                id: movie.id,
                title: movie.title,
                genres: movie
                    .genres
                    .into_iter()
                    .filter_map(|id| genres.get(&id).cloned())
                    .collect(),
            })
            .collect())
    }

    pub async fn movies_matching_genres(
        &self,
        genre_ids: Vec<i32>,
        excluded_movie_ids: Vec<i32>,
        min_match_count: i32,
    ) -> Result<Vec<MovieRecommendation>> {
        // A user can like multiple movies with the same genre, but recommendations should treat each genre once.
        let genre_ids = genre_ids.into_iter().collect::<HashSet<_>>();
        // If the profile has fewer unique genres than the threshold, no movie can satisfy the recommendation rule.
        if genre_ids.len() < min_match_count as usize {
            // Returning early avoids building a query that is guaranteed to produce no useful candidates.
            return Ok(Vec::new());
        }
        // Pair generation needs stable positional iteration, so the deduped set becomes a Vec for the next step.
        let genre_ids = genre_ids.into_iter().collect::<Vec<_>>();

        // The DB only needs to prove a movie has at least one two-genre niche before Rust scores the full match count.
        let mut matching_pair_conditions = Condition::any();
        // Pairing every taste genre lets the query reject one-off matches without requiring raw SQL count logic.
        for (index, left) in genre_ids.iter().enumerate() {
            // Later items produce each unordered pair once, keeping the generated WHERE clause smaller.
            for right in genre_ids.iter().skip(index + 1) {
                // Each pair predicate is indexable and keeps the candidate set smaller than a broad single-genre match.
                matching_pair_conditions = matching_pair_conditions.add(
                    // Keeping this as a SeaORM expression avoids raw SQL while still using the genres GIN index.
                    Expr::col(Column::Genres)
                        // A two-item value enforces the internal minimum of two genres at the database filter step.
                        .binary(PgBinOper::Contains, Expr::val(vec![*left, *right])),
                );
            }
        }

        // The pair filter pushes the expensive catalog narrowing into Postgres instead of loading all movies.
        let mut query = Movies::find().filter(matching_pair_conditions);
        // An empty exclusion list does not change results, so skip adding a pointless predicate.
        if !excluded_movie_ids.is_empty() {
            // Remove excluded ids (caller decides, e.g. dismiss low ratings) before scoring.
            query = query.filter(Column::Id.is_not_in(excluded_movie_ids));
        }

        // Scoring still needs exact match counts, and set lookup keeps that per-candidate work cheap.
        let taste_genres = genre_ids.into_iter().collect::<HashSet<_>>();
        // Fetch the narrowed candidate set, then compute the exact count SeaORM cannot express cleanly here.
        let mut movies = query
            // This query should hit the genre index through the pair containment predicates above.
            .all(&self.connection)
            // Database failures should abort recommendations instead of returning partial or misleading data.
            .await?
            // The models are no longer needed elsewhere, so consuming them avoids unnecessary cloning.
            .into_iter()
            // Filtering here enforces the same threshold even if the pair prefilter changes later.
            .filter_map(|movie| {
                // The score is the number of distinct taste genres present on this candidate movie.
                let match_count = movie
                    // The movie already carries genre ids, so no per-movie genre query is needed.
                    .genres
                    // Borrowing lets us count before moving the genre Vec into the result tuple.
                    .iter()
                    // Set membership makes each genre check constant time for practical purposes.
                    .filter(|genre_id| taste_genres.contains(genre_id))
                    // The count is converted to i32 because the response model and threshold use i32.
                    .count() as i32;

                // The pair query is a prefilter; this exact check is the real recommendation cutoff.
                (match_count >= min_match_count).then_some((
                    // The id is needed by the client and for deterministic sorting below.
                    movie.id,
                    // The title is part of the recommendation payload, so carry it forward now.
                    movie.title,
                    // Raw genre ids are kept so label lookup can be batched after scoring.
                    movie.genres,
                    // The score explains how close the recommendation is to the user's profile.
                    match_count,
                ))
            })
            // Sorting needs the whole candidate list, so collect the iterator here.
            .collect::<Vec<_>>();

        // Stronger genre matches should be shown first, while id ordering prevents unstable ties.
        movies.sort_by(|left, right| right.3.cmp(&left.3).then_with(|| left.0.cmp(&right.0)));

        // Label lookup is done after filtering so the genres table query stays limited to returned movies.
        let genre_ids = movies
            // The scored tuple contains the raw genre ids needed for label lookup.
            .iter()
            // Flattening builds one lookup list instead of querying labels movie by movie.
            .flat_map(|(_, _, genres, _)| genres.iter().copied())
            // SeaORM needs a concrete collection for the IN condition.
            .collect::<Vec<_>>();

        // Fetch labels once so response mapping remains cheap and avoids repeated database calls.
        let genres = Genres::find()
            // Restricting by ids avoids reading the whole genre dictionary if it grows later.
            .filter(genres::Column::Id.is_in(genre_ids))
            // This is the second and final query needed to produce user-facing genre names.
            .all(&self.connection)
            // Missing database access should fail the endpoint instead of returning unlabeled results silently.
            .await?
            // The rows are consumed because only the id and title are needed after this point.
            .into_iter()
            // A map gives cheap id to title translation while building each recommendation.
            .map(|genre| (genre.id, genre.title))
            // The response builder below needs random access by genre id.
            .collect::<HashMap<_, _>>();

        // Return the database model shape expected by RPC instead of exposing internal scoring tuples.
        Ok(movies
            // Consuming the scored list avoids cloning titles and genre arrays.
            .into_iter()
            // Each tuple becomes one response-ready recommendation record.
            .map(
                // Destructuring keeps the conversion explicit without introducing a temporary struct.
                |(id, title, movie_genres, match_count)| MovieRecommendation {
                    // The caller needs the movie id to link ratings or future movie detail requests.
                    id,
                    // The title keeps recommendations usable without another movie lookup.
                    title,
                    // Clients already display genre names, so ids are translated before leaving the model layer.
                    genres: movie_genres
                        // The raw ids are no longer needed once names are produced.
                        .into_iter()
                        // A missing label should not discard an otherwise valid movie recommendation.
                        .filter_map(|id| genres.get(&id).cloned())
                        // The RPC response expects an owned Vec of genre names.
                        .collect(),
                    // The score lets callers group results by closest match without recalculating it.
                    match_count,
                },
            )
            // The function returns all recommendations now because pagination is not part of this endpoint yet.
            .collect())
    }
}
