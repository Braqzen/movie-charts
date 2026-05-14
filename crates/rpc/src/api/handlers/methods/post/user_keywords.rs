use {
    crate::{api::Error, state::State as ServerState},
    axum::{Json, extract::State, http::StatusCode, response::IntoResponse},
    sea_orm::SqlErr,
    serde::Deserialize,
    std::sync::Arc,
};

#[derive(Debug, Deserialize)]
pub struct InsertUserKeywordRequest {
    pub user_id: u32,
    pub keyword_id: i32,
}

impl InsertUserKeywordRequest {
    fn validate(self) -> Result<(i32, i32), (StatusCode, Json<Error>)> {
        if self.user_id == 0 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(Error::new("user_id must be positive".to_string())),
            ));
        }
        if self.keyword_id <= 0 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(Error::new("keyword_id must be positive".to_string())),
            ));
        }
        let user_id = i32::try_from(self.user_id).map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(Error::new("user_id is too large".to_string())),
            )
        })?;
        Ok((user_id, self.keyword_id))
    }
}

#[axum::debug_handler]
pub async fn insert_user_keyword_handler(
    State(state): State<Arc<ServerState>>,
    Json(request): Json<InsertUserKeywordRequest>,
) -> impl IntoResponse {
    let (user_id, keyword_id) = match request.validate() {
        Ok(pair) => pair,
        Err(error) => return error.into_response(),
    };

    match state.database.insert_user_keyword(user_id, keyword_id).await {
        Ok(()) => StatusCode::CREATED.into_response(),
        Err(ref err)
            if matches!(
                err.sql_err(),
                Some(SqlErr::ForeignKeyConstraintViolation(_))
            ) =>
        {
            (
                StatusCode::NOT_FOUND,
                Json(Error::new("User or keyword not found".to_string())),
            )
                .into_response()
        }
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(Error::new(error.to_string())),
        )
            .into_response(),
    }
}
