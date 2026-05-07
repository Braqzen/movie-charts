use {crate::api::Error, axum::Json};

// Handler for routes that don't exist
pub async fn not_found() -> Json<Error> {
    Json(Error {
        error: "Invalid request endpoint".to_string(),
    })
}
