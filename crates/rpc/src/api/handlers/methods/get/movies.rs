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

#[derive(Debug, Deserialize, Default)]
pub struct Parameters {
    #[serde(default)]
    pub query: String,
}

impl Parameters {
    pub fn validate(&self) -> Result<String, (StatusCode, Json<Error>)> {
        let query = self.query.trim().to_lowercase();
        if query.is_empty() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(Error::new("Query is empty".to_string())),
            ));
        }
        if query.len() > 100 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(Error::new("Query is too long".to_string())),
            ));
        }
        Ok(query.to_string())
    }
}

#[derive(Debug, Serialize)]
pub struct MovieResponse {
    pub id: i32,
    pub title: String,
    pub genres: Vec<String>,
    pub keywords: Vec<String>,
}

#[axum::debug_handler]
pub async fn search_movies_handler(
    State(state): State<Arc<ServerState>>,
    Query(query): Query<Parameters>,
) -> impl IntoResponse {
    let query = match query.validate() {
        Ok(query) => query,
        Err(error) => return error.into_response(),
    };

    match state.database.search_movies(&query).await {
        Ok(movies) => Json(
            movies
                .into_iter()
                .map(|movie| MovieResponse {
                    id: movie.id,
                    title: movie.title,
                    genres: movie.genres,
                    keywords: movie.keywords,
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
