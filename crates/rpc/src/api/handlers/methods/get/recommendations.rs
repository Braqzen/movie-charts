use {
    crate::{api::Error, state::State as ServerState},
    axum::{
        Json,
        extract::{Query, State},
        http::StatusCode,
        response::IntoResponse,
    },
    sea_orm::prelude::Decimal,
    serde::{Deserialize, Serialize},
    std::{collections::HashSet, sync::Arc},
};

const MIN_MATCH_COUNT: i32 = 2;

#[derive(Debug, Deserialize)]
pub struct Parameters {
    pub user_id: u32,
}

impl Parameters {
    pub fn validate(&self) -> Result<i32, (StatusCode, Json<Error>)> {
        if self.user_id == 0 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(Error::new("user_id must be positive".to_string())),
            ));
        }
        i32::try_from(self.user_id).map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(Error::new("user_id is too large".to_string())),
            )
        })
    }
}

#[derive(Debug, Serialize)]
pub struct RecommendationResponse {
    pub id: i32,
    pub title: String,
    pub genres: Vec<String>,
    pub match_count: i32,
}

#[axum::debug_handler]
pub async fn recommendations_handler(
    State(state): State<Arc<ServerState>>,
    Query(query): Query<Parameters>,
) -> impl IntoResponse {
    let user_id = match query.validate() {
        Ok(user_id) => user_id,
        Err(error) => return error.into_response(),
    };

    let ratings = match state.database.user_ratings(user_id).await {
        Ok(ratings) => ratings,
        Err(error) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(Error::new(error.to_string())),
            )
                .into_response();
        }
    };

    let four = Decimal::from(4);
    let excluded_movie_ids = ratings
        .iter()
        .filter(|rating| !rating.like && rating.rating < four)
        .map(|rating| rating.movie_id)
        .collect::<Vec<_>>();
    let genre_ids = ratings
        .iter()
        .filter(|rating| rating.like || rating.rating >= four)
        .flat_map(|rating| rating.genre_ids.iter().copied())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect::<Vec<_>>();

    match state
        .database
        .movies_matching_genres(genre_ids, excluded_movie_ids, MIN_MATCH_COUNT)
        .await
    {
        Ok(movies) => Json(
            movies
                .into_iter()
                .map(|movie| RecommendationResponse {
                    id: movie.id,
                    title: movie.title,
                    genres: movie.genres,
                    match_count: movie.match_count,
                })
                .collect::<Vec<_>>(),
        )
        .into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(Error::new(error.to_string())),
        )
            .into_response(),
    }
}
