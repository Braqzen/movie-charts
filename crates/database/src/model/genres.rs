use crate::{
    Database,
    entities::{
        genres::{ActiveModel, Model},
        prelude::Genres,
    },
};
use eyre::{Result, eyre};
use sea_orm::{ActiveValue::Set, EntityTrait};

impl Database {
    pub async fn new_genres(&self, genres: Vec<(i32, String)>) -> Result<()> {
        if genres.is_empty() {
            return Ok(());
        }

        let genres = genres.into_iter().map(|(id, title)| ActiveModel {
            id: Set(id),
            title: Set(title),
        });

        Genres::insert_many(genres)
            .on_conflict_do_nothing()
            .exec_without_returning(&self.connection)
            .await?;

        Ok(())
    }

    /// Get a genre by its ID
    pub async fn genre(&self, id: i32) -> Result<Model> {
        let genre = Genres::find_by_id(id)
            .one(&self.connection)
            .await?
            .ok_or_else(|| eyre!("Genre not found"))?;

        Ok(genre)
    }
}
