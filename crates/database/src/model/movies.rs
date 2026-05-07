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
    ColumnTrait, EntityTrait, QueryFilter,
    sea_query::{Expr, extension::postgres::PgExpr},
};
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct MovieWithGenres {
    pub id: i32,
    pub title: String,
    pub genres: Vec<String>,
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
}
