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
pub struct QueryParams {
    pub user_id: u32,
}

impl QueryParams {
    fn validate(self) -> Result<i32, (StatusCode, Json<Error>)> {
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
pub struct KeywordRow {
    pub id: i32,
    pub title: String,
}

#[axum::debug_handler]
pub async fn list_user_keywords_handler(
    State(state): State<Arc<ServerState>>,
    Query(query): Query<QueryParams>,
) -> impl IntoResponse {
    let user_id = match query.validate() {
        Ok(id) => id,
        Err(error) => return error.into_response(),
    };

    match state.database.user_keyword_rows(user_id).await {
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
