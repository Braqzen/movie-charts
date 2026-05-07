//! This module ...

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Error {
    pub error: String,
}

impl Error {
    pub fn new(error: String) -> Self {
        Self { error }
    }
}
