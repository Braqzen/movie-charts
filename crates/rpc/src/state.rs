use database::Database;
use eyre::Result;
use std::sync::Arc;

#[derive(Clone)]
pub struct State {
    pub database: Arc<Database>,
}

impl State {
    pub fn new(database: Arc<Database>) -> Result<Self> {
        Ok(Self { database })
    }
}
