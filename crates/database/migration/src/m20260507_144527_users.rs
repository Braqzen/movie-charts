use crate::m20220101_000001_movie_table::Movies;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(pk_auto(Users::Id))
                    .col(string_uniq(Users::Username))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Ratings::Table)
                    .if_not_exists()
                    .col(pk_auto(Ratings::Id))
                    .col(integer(Ratings::UserId))
                    .col(integer(Ratings::MovieId))
                    .col(decimal(Ratings::Rating))
                    .col(boolean(Ratings::Like))
                    .foreign_key(
                        ForeignKey::create()
                            .from(Ratings::Table, Ratings::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Ratings::Table, Ratings::MovieId)
                            .to(Movies::Table, Movies::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Restrict),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .unique()
                    .table(Ratings::Table)
                    .col(Ratings::UserId)
                    .col(Ratings::MovieId)
                    .name("ratings_user_movie_unique_index")
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Ratings::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
    Username,
}

#[derive(DeriveIden)]
enum Ratings {
    Table,
    Id,
    UserId,
    MovieId,
    Rating,
    Like,
}
