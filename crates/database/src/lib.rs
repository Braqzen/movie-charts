mod entities;
mod model;

use eyre::Result;
use migration::{Migrator, MigratorTrait};
use sea_orm::{Database as SeaDatabase, DatabaseConnection};

pub struct Database {
    connection: DatabaseConnection,
}

impl Database {
    pub async fn new(url: &str) -> Result<Self> {
        let connection = SeaDatabase::connect(url).await?;

        // Automatically apply all migrations
        Migrator::up(&connection, None).await?;

        Ok(Self { connection })
    }
}
