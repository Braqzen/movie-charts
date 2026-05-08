use crate::{
    Database,
    entities::{
        genres::{ActiveModel, Model},
        prelude::{Genres, Movies},
    },
};
use eyre::{Result, eyre};
use sea_orm::{ActiveValue::Set, EntityTrait};
use std::collections::{BTreeMap, HashMap};

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

    pub async fn genre_catalog_counts(&self) -> Result<BTreeMap<String, i64>> {
        let genre_rows = Genres::find().all(&self.connection).await?;
        let title_by_id: HashMap<i32, String> =
            genre_rows.iter().map(|g| (g.id, g.title.clone())).collect();

        let mut tallies: BTreeMap<String, i64> =
            genre_rows.into_iter().map(|g| (g.title, 0i64)).collect();

        let movies = Movies::find().all(&self.connection).await?;
        for movie in movies {
            for genre_id in movie.genres {
                if let Some(title) = title_by_id.get(&genre_id) {
                    if let Some(c) = tallies.get_mut(title) {
                        *c += 1;
                    }
                }
            }
        }

        Ok(tallies)
    }
}
