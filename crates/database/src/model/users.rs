use crate::{
    Database,
    entities::{
        genres, movies,
        prelude::{Genres, Movies, Ratings, Users},
        ratings,
        users::{ActiveModel, Column, Model},
    },
};
use eyre::Result;
use sea_orm::prelude::Decimal;
use sea_orm::{ActiveValue::NotSet, ActiveValue::Set, ColumnTrait, EntityTrait, QueryFilter};
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct UserMovieRating {
    pub movie_id: i32,
    pub movie_title: String,
    pub genre_ids: Vec<i32>,
    pub genres: Vec<String>,
    pub rating: Decimal,
    pub like: bool,
}

impl Database {
    pub async fn insert_user(&self, username: String) -> Result<i32> {
        let row = Users::insert(ActiveModel {
            id: NotSet,
            username: Set(username),
        })
        .exec_with_returning(&self.connection)
        .await?;

        Ok(row.id)
    }

    pub async fn users(&self) -> Result<Vec<Model>> {
        Ok(Users::find().all(&self.connection).await?)
    }

    pub async fn user_id(&self, username: &str) -> Result<Option<i32>> {
        Ok(Users::find()
            .filter(Column::Username.eq(username))
            .one(&self.connection)
            .await?
            .map(|m| m.id))
    }

    pub async fn user_ratings(&self, user_id: i32) -> Result<Vec<UserMovieRating>> {
        let ratings = Ratings::find()
            .filter(ratings::Column::UserId.eq(user_id))
            .all(&self.connection)
            .await?;

        let movie_ids = ratings
            .iter()
            .map(|rating| rating.movie_id)
            .collect::<Vec<_>>();

        let movies = Movies::find()
            .filter(movies::Column::Id.is_in(movie_ids))
            .all(&self.connection)
            .await?;

        let genre_ids = movies
            .iter()
            .flat_map(|movie| movie.genres.iter().copied())
            .collect::<Vec<_>>();

        let genres = Genres::find()
            .filter(genres::Column::Id.is_in(genre_ids))
            .all(&self.connection)
            .await?
            .into_iter()
            .map(|genre| (genre.id, genre.title))
            .collect::<HashMap<_, _>>();

        let movies = movies
            .into_iter()
            .map(|movie| (movie.id, movie))
            .collect::<HashMap<_, _>>();

        Ok(ratings
            .into_iter()
            .filter_map(|rating| {
                let movie = movies.get(&rating.movie_id)?;
                Some(UserMovieRating {
                    movie_id: rating.movie_id,
                    movie_title: movie.title.clone(),
                    genre_ids: movie.genres.clone(),
                    genres: movie
                        .genres
                        .iter()
                        .filter_map(|id| genres.get(id).cloned())
                        .collect(),
                    rating: rating.rating,
                    like: rating.like,
                })
            })
            .collect())
    }
}
