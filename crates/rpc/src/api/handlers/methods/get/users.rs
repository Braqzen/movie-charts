use {
    crate::{api::Error, state::State as ServerState},
    axum::{Json, extract::State, http::StatusCode, response::IntoResponse},
    serde::Serialize,
    std::sync::Arc,
};

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: i32,
    pub username: String,
}

#[axum::debug_handler]
pub async fn users_handler(State(state): State<Arc<ServerState>>) -> impl IntoResponse {
    match state.database.users().await {
        Ok(users) => Json(
            users
                .into_iter()
                .map(|user| UserResponse {
                    id: user.id,
                    username: user.username,
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
