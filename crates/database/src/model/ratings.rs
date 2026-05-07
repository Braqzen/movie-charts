use crate::{
    Database,
    entities::{
        prelude::Ratings,
        ratings::{ActiveModel, Column},
    },
};
use eyre::Result;
use sea_orm::{
    ActiveValue::NotSet, ActiveValue::Set, EntityTrait, prelude::Decimal, sea_query::OnConflict,
};

impl Database {
    pub async fn insert_rating(
        &self,
        user_id: i32,
        movie_id: i32,
        rating: Decimal,
        like: bool,
    ) -> Result<i32> {
        let row = Ratings::insert(ActiveModel {
            id: NotSet,
            user_id: Set(user_id),
            movie_id: Set(movie_id),
            rating: Set(rating),
            like: Set(like),
        })
        .on_conflict(
            OnConflict::columns([Column::UserId, Column::MovieId])
                .update_columns([Column::Rating, Column::Like])
                .to_owned(),
        )
        .exec_with_returning(&self.connection)
        .await?;

        Ok(row.id)
    }
}
