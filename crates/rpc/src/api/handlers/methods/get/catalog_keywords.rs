use {
    crate::{api::Error, state::State as ServerState},
    axum::{Json, extract::State, http::StatusCode, response::IntoResponse},
    serde::Serialize,
    std::sync::Arc,
};

#[derive(Debug, Serialize)]
pub struct KeywordRow {
    pub id: i32,
    pub title: String,
}

#[axum::debug_handler]
pub async fn catalog_keywords_handler(
    State(state): State<Arc<ServerState>>,
) -> impl IntoResponse {
    match state.database.catalog_keywords().await {
        Ok(rows) => Json(
            rows.into_iter()
                .map(|(id, title)| KeywordRow { id, title })
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
