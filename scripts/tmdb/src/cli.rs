use crate::commands::add_movies::AddMovies;
use clap::Parser;

#[derive(Parser)]
pub enum Cli {
    /// Add movies to the database
    AddMovies(AddMovies),
}
