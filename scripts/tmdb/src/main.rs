mod cli;
mod client;
mod commands;

use crate::client::TmdbClient;
use clap::Parser;
use cli::Cli;
use database::Database;
use eyre::Result;
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    let shutdown = Arc::new(AtomicBool::new(false));
    let shutdown_signal = shutdown.clone();

    tokio::spawn(async move {
        if let Err(error) = tokio::signal::ctrl_c().await {
            eprintln!("Failed to listen for shutdown signal: {error:?}");
            return;
        }

        shutdown_signal.store(true, Ordering::SeqCst);
        eprintln!("Shutdown requested; stopping after the current item.");
    });

    let database_url = std::env::var("DATABASE_URL")?;
    let tmdb_api_key = std::env::var("TMDB_API_KEY")?;

    let database = Database::new(&database_url).await?;
    let tmdb_client = TmdbClient::new(&tmdb_api_key);

    match cli {
        Cli::AddMovies(command) => command.run(&database, &tmdb_client, shutdown).await?,
    }

    Ok(())
}
