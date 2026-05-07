mod get;
mod post;

pub use get::{movies::search_movies_handler, ratings::user_ratings_handler, users::users_handler};
pub use post::{ratings::insert_rating_handler, users::insert_user_handler};
