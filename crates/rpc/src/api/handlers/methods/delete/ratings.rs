use {
    crate::{api::Error, state::State as ServerState},
    axum::{
        Json,
        extract::{Query, State},
        http::StatusCode,
        response::IntoResponse,
    },
    serde::Deserialize,
    std::sync::Arc,
};

#[derive(Debug, Deserialize)]
pub struct Parameters {
    pub user_id: u32,
    pub movie_id: u32,
}

impl Parameters {
    pub fn validate(&self) -> Result<(i32, i32), (StatusCode, Json<Error>)> {
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
        let user_id = i32::try_from(self.user_id).map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(Error::new("user_id is too large".to_string())),
            )
        })?;
        let movie_id = i32::try_from(self.movie_id).map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(Error::new("movie_id is too large".to_string())),
            )
        })?;
        Ok((user_id, movie_id))
    }
}

#[axum::debug_handler]
pub async fn delete_rating_handler(
    State(state): State<Arc<ServerState>>,
    Query(query): Query<Parameters>,
) -> impl IntoResponse {
    let (user_id, movie_id) = match query.validate() {
        Ok(ids) => ids,
        Err(error) => return error.into_response(),
    };

    match state.database.delete_rating(user_id, movie_id).await {
        Ok(0) => (
            StatusCode::NOT_FOUND,
            Json(Error::new("Rating not found".to_string())),
        )
            .into_response(),
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(Error::new(error.to_string())),
        )
            .into_response(),
    }
}
