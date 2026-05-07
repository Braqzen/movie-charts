use reqwest::header::ACCEPT;
use reqwest::{Client, StatusCode};
use serde::Deserialize;

pub struct ImdbClient {
    client: Client,
    api_key: String,
}

impl ImdbClient {
    pub fn new(api_key: &str) -> Self {
        Self {
            client: Client::new(),
            api_key: api_key.to_string(),
        }
    }

    pub async fn movie(&self, id: i32) -> QueryResult {
        let response = match self
            .client
            .get(format!("https://api.themoviedb.org/3/movie/{id}"))
            .header(ACCEPT, "application/json")
            .bearer_auth(self.api_key.trim())
            .send()
            .await
        {
            Err(error) => return QueryResult::ClientFailed(error),
            Ok(response) => response,
        };

        let status = response.status();
        if !status.is_success() {
            return QueryResult::BadStatus(status);
        }

        match response.json::<ImdbMovie>().await {
            Err(error) => {
                if error.is_decode() {
                    QueryResult::DeserializeFailed(error)
                } else {
                    QueryResult::ClientFailed(error)
                }
            }
            Ok(movie) => QueryResult::Movie(movie),
        }
    }
}

/// Result of a single TMDB movie fetch.
#[derive(Debug)]
pub enum QueryResult {
    /// Transport failure, or failing to read/decode the body in a non-JSON way.
    ClientFailed(reqwest::Error),
    /// Received a response with non-success HTTP status (4xx / 5xx).
    BadStatus(StatusCode),
    /// JSON body existed but failed to deserialize into [`ImdbMovie`].
    DeserializeFailed(reqwest::Error),
    /// Successfully received a usable movie.
    Movie(ImdbMovie),
}

#[derive(Clone, Debug, Deserialize)]
pub struct ImdbMovie {
    pub title: String,
    pub genres: Vec<Genre>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct Genre {
    pub id: i32,
    pub name: String,
}
