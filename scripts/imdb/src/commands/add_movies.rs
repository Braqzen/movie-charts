use crate::client::{ImdbClient, QueryResult};
use clap::Args;
use database::Database;
use eyre::Result;
use reqwest::StatusCode;
use serde::Deserialize;
use std::{
    fs::File,
    io::{BufRead, BufReader},
    path::PathBuf,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::Duration,
};
use tokio::time::sleep;

const TMDB_REQUEST_DELAY: Duration = Duration::from_millis(275);

#[derive(Args)]
pub struct AddMovies {
    /// File containing a movie dump
    ///
    /// movie_ids_DD_MM_YYYY.json
    #[arg(long, required = true)]
    pub file: PathBuf,
}

impl AddMovies {
    pub async fn run(
        &self,
        database: &Database,
        client: &ImdbClient,
        shutdown: Arc<AtomicBool>,
    ) -> Result<()> {
        let file = File::open(&self.file)?;
        let reader = BufReader::new(file);

        for line in reader.lines() {
            if shutdown.load(Ordering::SeqCst) {
                break;
            }

            if let Ok(line) = line {
                if line.is_empty() {
                    continue;
                }

                let movie: MovieLine = serde_json::from_str(line.as_str())?;
                let movie: Movie = movie.into();

                // If invalid then skip so we do not query imdb
                match database.invalid_movie(movie.id).await {
                    Ok(true) => continue,
                    _ => {}
                }

                // If movie already exists then skip so we do not query imdb
                match database.movie(movie.id).await {
                    Ok(Some(_)) => continue,
                    _ => {}
                }

                sleep(TMDB_REQUEST_DELAY).await;

                match client.movie(movie.id).await {
                    QueryResult::ClientFailed(err) | QueryResult::DeserializeFailed(err) => {
                        eprintln!("Client error: {} - {err:?}", movie.id);
                        continue;
                    }
                    QueryResult::BadStatus(status) => {
                        if status == StatusCode::NOT_FOUND {
                            if let Err(error) = database.new_invalid_movie(movie.id).await {
                                eprintln!("Error adding invalid movie {}: {error:?}", movie.id);
                            }
                        }

                        continue;
                    }
                    QueryResult::Movie(details) => {
                        if let Err(error) = database
                            .insert_movie(
                                movie.id,
                                details.title.clone(),
                                details
                                    .genres
                                    .iter()
                                    .map(|genre| genre.id)
                                    .collect::<Vec<i32>>(),
                            )
                            .await
                        {
                            let message = error.to_string();
                            if message.contains("duplicate key value") {
                                // Fallback message in case we error'd on the initial check
                                eprintln!("Skipping duplicate: {} - {}", movie.id, details.title);
                                continue;
                            }

                            eprintln!("Error adding movie {}: {message}", movie.id);
                            continue;
                        }

                        println!("Added movie: {} - {}", movie.id, details.title);

                        if let Err(error) = database
                            .new_genres(
                                details
                                    .genres
                                    .into_iter()
                                    .map(|genre| (genre.id, genre.name))
                                    .collect(),
                            )
                            .await
                        {
                            eprintln!("Error adding genres: {} - {error:?}", movie.id);
                        }
                    }
                }
            } else {
                eprintln!("Error reading line: {:?}", line.err());
            }
        }

        Ok(())
    }
}

#[derive(Debug, Deserialize)]
struct MovieLine {
    id: i32,
    adult: bool,
    video: bool,
    popularity: f32,
    original_title: String,
}

impl From<MovieLine> for Movie {
    fn from(line: MovieLine) -> Self {
        Self {
            id: line.id,
            title: line.original_title,
        }
    }
}

struct Movie {
    id: i32,
    title: String,
}
