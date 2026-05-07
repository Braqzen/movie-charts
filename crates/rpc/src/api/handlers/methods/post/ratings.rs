use {
    crate::{api::Error, state::State as ServerState},
    axum::{Json, extract::State, http::StatusCode, response::IntoResponse},
    sea_orm::prelude::Decimal,
    serde::{Deserialize, Serialize},
    std::sync::Arc,
};

#[derive(Debug, Deserialize)]
pub struct InsertRatingRequest {
    pub user_id: u32,
    pub movie_id: u32,
    pub rating: Decimal,
    pub like: bool,
}

pub struct ValidRatingRequest {
    pub user_id: u32,
    pub movie_id: u32,
    pub rating: Decimal,
    pub like: bool,
}

impl InsertRatingRequest {
    pub fn validate(self) -> Result<ValidRatingRequest, (StatusCode, Json<Error>)> {
        if self.user_id == 0 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(Error::new("user_id must be positive".to_string())),
            ));
        }
        if self.movie_id == 0 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(Error::new("movie_id must be positive".to_string())),
            ));
        }
        if self.rating < Decimal::from(0) || self.rating > Decimal::from(5) {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(Error::new("rating must be between 0 and 5".to_string())),
            ));
        }

        Ok(ValidRatingRequest {
            user_id: self.user_id,
            movie_id: self.movie_id,
            rating: self.rating,
            like: self.like,
        })
    }
}

#[derive(Debug, Serialize)]
pub struct InsertRatingResponse {
    pub id: i32,
}

#[axum::debug_handler]
pub async fn insert_rating_handler(
    State(state): State<Arc<ServerState>>,
    Json(request): Json<InsertRatingRequest>,
) -> impl IntoResponse {
    let request = match request.validate() {
        Ok(request) => request,
        Err(error) => return error.into_response(),
    };

    match state
        .database
        .insert_rating(
            match i32::try_from(request.user_id) {
                Ok(user_id) => user_id,
                Err(_) => {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(Error::new("user_id is too large".to_string())),
                    )
                        .into_response();
                }
            },
            match i32::try_from(request.movie_id) {
                Ok(movie_id) => movie_id,
                Err(_) => {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(Error::new("movie_id is too large".to_string())),
                    )
                        .into_response();
                }
            },
            request.rating,
            request.like,
        )
        .await
    {
        Ok(id) => (StatusCode::CREATED, Json(InsertRatingResponse { id })).into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(Error::new(error.to_string())),
        )
            .into_response(),
    }
}
