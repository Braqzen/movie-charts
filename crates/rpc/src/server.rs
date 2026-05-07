use crate::{
    api::{
        insert_rating_handler, insert_user_handler, not_found, search_movies_handler,
        user_ratings_handler, users_handler,
    },
    state::State,
};
use axum::{Router, routing::get, serve};
use database::Database;
use eyre::Result;
use std::{net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

pub struct Server {
    /// The socket address to bind the server to
    socket: SocketAddr,
    /// The database connection
    database: Arc<Database>,
}

impl Server {
    pub async fn new(socket: SocketAddr, database_url: &str) -> Result<Self> {
        let database = Arc::new(Database::new(database_url).await?);

        Ok(Self { socket, database })
    }

    pub async fn run(self) -> Result<()> {
        let state = Arc::new(State::new(self.database.clone())?);
        let listener = TcpListener::bind(self.socket).await?;

        let cors = CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any);

        let app = Router::new()
            .nest(
                "/api",
                Router::new()
                    .route("/users", get(users_handler).post(insert_user_handler))
                    .route(
                        "/ratings",
                        get(user_ratings_handler).post(insert_rating_handler),
                    )
                    .route("/movies/search", get(search_movies_handler))
                    .fallback(not_found)
                    .with_state(state.clone()),
            )
            .layer(cors);

        info!(socket = self.socket.to_string(), "Starting router");

        serve(listener, app).await?;

        Ok(())
    }
}
