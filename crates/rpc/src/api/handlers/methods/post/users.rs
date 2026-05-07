use {
    crate::{api::Error, state::State as ServerState},
    axum::{Json, extract::State, http::StatusCode, response::IntoResponse},
    serde::{Deserialize, Serialize},
    std::sync::Arc,
};

#[derive(Debug, Deserialize)]
pub struct InsertUserRequest {
    pub username: String,
}

impl InsertUserRequest {
    pub fn validate(&self) -> Result<String, (StatusCode, Json<Error>)> {
        let username = self.username.trim().to_lowercase();
        if username.is_empty() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(Error::new("Username is empty".to_string())),
            ));
        }
        if username.len() > 25 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(Error::new("Username is too long".to_string())),
            ));
        }
        Ok(username.to_string())
    }
}

#[derive(Debug, Serialize)]
pub struct InsertUserResponse {
    pub id: i32,
    pub username: String,
}

#[axum::debug_handler]
pub async fn insert_user_handler(
    State(state): State<Arc<ServerState>>,
    Json(request): Json<InsertUserRequest>,
) -> impl IntoResponse {
    let username = match request.validate() {
        Ok(username) => username,
        Err(error) => return error.into_response(),
    };

    match state.database.insert_user(username.clone()).await {
        Ok(id) => (
            StatusCode::CREATED,
            Json(InsertUserResponse { id, username }),
        )
            .into_response(),
        Err(error) => (StatusCode::CONFLICT, Json(Error::new(error.to_string()))).into_response(),
    }
}
