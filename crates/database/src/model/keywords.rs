use crate::{
    Database,
    entities::{
        keywords::{ActiveModel, Column as KeywordColumn},
        prelude::{Keywords, UserKeywords},
        user_keywords::{ActiveModel as UserKeywordActive, Column as UserKeywordColumn},
    },
};
use eyre::Result;
use sea_orm::{
    ActiveValue::Set, ColumnTrait, DbErr, EntityTrait, QueryFilter, QueryOrder,
};

impl Database {
    pub async fn new_keywords(&self, rows: Vec<(i32, String)>) -> Result<()> {
        let rows = rows.into_iter().map(|(id, title)| ActiveModel {
            id: Set(id),
            title: Set(title),
        });

        Keywords::insert_many(rows)
            .on_conflict_do_nothing()
            .exec_without_returning(&self.connection)
            .await?;

        Ok(())
    }

    pub async fn catalog_keywords(&self) -> Result<Vec<(i32, String)>> {
        Ok(Keywords::find()
            .order_by_asc(KeywordColumn::Title)
            .all(&self.connection)
            .await?
            .into_iter()
            .map(|keyword| (keyword.id, keyword.title))
            .collect())
    }

    pub async fn user_keyword_rows(&self, user_id: i32) -> Result<Vec<(i32, String)>> {
        let links = UserKeywords::find()
            .filter(UserKeywordColumn::UserId.eq(user_id))
            .all(&self.connection)
            .await?;

        let keyword_ids = links
            .into_iter()
            .map(|link| link.keyword_id)
            .collect::<Vec<_>>();
        if keyword_ids.is_empty() {
            return Ok(Vec::new());
        }

        Ok(Keywords::find()
            .filter(KeywordColumn::Id.is_in(keyword_ids))
            .order_by_asc(KeywordColumn::Title)
            .all(&self.connection)
            .await?
            .into_iter()
            .map(|keyword| (keyword.id, keyword.title))
            .collect())
    }

    pub async fn insert_user_keyword(&self, user_id: i32, keyword_id: i32) -> Result<(), DbErr> {
        UserKeywords::insert(UserKeywordActive {
            user_id: Set(user_id),
            keyword_id: Set(keyword_id),
        })
        .on_conflict_do_nothing()
        .exec_without_returning(&self.connection)
        .await?;

        Ok(())
    }

    pub async fn delete_user_keyword(&self, user_id: i32, keyword_id: i32) -> Result<u64> {
        let result = UserKeywords::delete_many()
            .filter(UserKeywordColumn::UserId.eq(user_id))
            .filter(UserKeywordColumn::KeywordId.eq(keyword_id))
            .exec(&self.connection)
            .await?;

        Ok(result.rows_affected)
    }
}
