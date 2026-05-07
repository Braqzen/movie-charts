use crate::{
    Database,
    entities::{invalid_movies::ActiveModel, prelude::InvalidMovies},
};
use eyre::Result;
use sea_orm::{ActiveModelTrait, ActiveValue::Set, EntityTrait};

impl Database {
    /// Create an entry for a new movie
    pub async fn new_invalid_movie(&self, id: i32) -> Result<()> {
        let movie = ActiveModel { id: Set(id) };

        movie.insert(&self.connection).await?;
        Ok(())
    }

    /// Check if a movie is listed as invalid
    pub async fn invalid_movie(&self, id: i32) -> Result<bool> {
        if let Some(_) = InvalidMovies::find_by_id(id).one(&self.connection).await? {
            Ok(true)
        } else {
            Ok(false)
        }
    }
}
