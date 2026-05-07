pub use sea_orm_migration::prelude::*;

mod m20220101_000001_movie_table;
mod m20260507_144527_users;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_movie_table::Migration),
            Box::new(m20260507_144527_users::Migration),
        ]
    }
}
