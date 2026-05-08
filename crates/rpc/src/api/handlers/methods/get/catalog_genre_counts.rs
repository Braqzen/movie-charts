use {
    crate::{api::Error, state::State as ServerState},
    axum::{Json, extract::State, http::StatusCode, response::IntoResponse},
    std::sync::Arc,
};

#[axum::debug_handler]
pub async fn catalog_genre_counts_handler(
    State(state): State<Arc<ServerState>>,
) -> impl IntoResponse {
    match state.database.genre_catalog_counts().await {
        Ok(counts) => Json(counts).into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(Error::new(error.to_string())),
        )
            .into_response(),
    }
}
