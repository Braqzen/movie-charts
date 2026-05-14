use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Movies::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Movies::Id)
                            .integer()
                            .not_null()
                            .primary_key(),
                    )
                    .col(string(Movies::Title))
                    .col(array(Movies::Genres, ColumnType::Integer))
                    .col(array(Movies::Keywords, ColumnType::Integer))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Genres::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Genres::Id)
                            .integer()
                            .not_null()
                            .primary_key(),
                    )
                    .col(string(Genres::Title))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Keywords::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Keywords::Id)
                            .integer()
                            .not_null()
                            .primary_key(),
                    )
                    .col(string(Keywords::Title))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(InvalidMovies::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(InvalidMovies::Id)
                            .integer()
                            .not_null()
                            .primary_key(),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared("CREATE EXTENSION IF NOT EXISTS pg_trgm")
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_movies_title_trgm ON movies USING gin (title gin_trgm_ops)",
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_movies_genres_gin ON movies USING gin (genres)",
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_movies_keywords_gin ON movies USING gin (keywords)",
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Movies::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(Genres::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(Keywords::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(InvalidMovies::Table).to_owned())
            .await?;

        Ok(())
    }
}

/// Information about movies we want to store
///
/// Each movie has its own ID therefore we do not use our own ID
/// Genres have a name and ID so we store the ID to save on space and join on the Genres table
#[derive(DeriveIden)]
pub enum Movies {
    Table,
    Id,
    Title,
    Genres,
    Keywords,
}

/// Information about genres we want to store
///
/// A genre consists of an ID and a name such as "Adventure"
#[derive(DeriveIden)]
enum Genres {
    Table,
    Id,
    Title,
}

/// Keyword catalog (TMDB keyword id and name)
#[derive(DeriveIden)]
pub enum Keywords {
    Table,
    Id,
    Title,
}

/// Information about invalid movies
///
/// Users can add movies meaning they can add invalid entries that have no api info
/// We do not want to query the api again therefore we store the ID and skip the movie if found here
#[derive(DeriveIden)]
enum InvalidMovies {
    Table,
    Id,
}
