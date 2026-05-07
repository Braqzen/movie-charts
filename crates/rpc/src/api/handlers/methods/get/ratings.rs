use {
    crate::{api::Error, state::State as ServerState},
    axum::{
        Json,
        extract::{Query, State},
        http::StatusCode,
        response::IntoResponse,
    },
    serde::{Deserialize, Serialize},
    std::sync::Arc,
};

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
pub struct RatingResponse {
    pub movie_id: i32,
    pub title: String,
    pub genres: Vec<String>,
    pub rating: String,
    pub like: bool,
}

#[axum::debug_handler]
pub async fn user_ratings_handler(
    State(state): State<Arc<ServerState>>,
    Query(query): Query<Parameters>,
) -> impl IntoResponse {
    let user_id = match query.validate() {
        Ok(user_id) => user_id,
        Err(error) => return error.into_response(),
    };

    match state.database.user_ratings(user_id).await {
        Ok(ratings) => Json(
            ratings
                .into_iter()
                .map(|rating| RatingResponse {
                    movie_id: rating.movie_id,
                    title: rating.movie_title,
                    genres: rating.genres,
                    rating: rating.rating.to_string(),
                    like: rating.like,
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
