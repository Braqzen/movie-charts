use eyre::{Result, eyre};
use std::{net::SocketAddr, str::FromStr};

pub struct Cli {
    pub socket: Option<SocketAddr>,
    pub database_url: Option<String>,
}

impl Cli {
    pub fn parse() -> Result<Self> {
        // Skip binary name
        let mut args = std::env::args().skip(1);

        let mut socket: Option<SocketAddr> = None;
        let mut database_url: Option<String> = None;

        while let Some(arg) = args.next() {
            match arg.as_str() {
                "--socket" | "-s" => {
                    if let Some(val) = args.next() {
                        socket = Some(SocketAddr::from_str(&val)?);
                    } else {
                        return Err(eyre!("--socket requires a value"));
                    }
                }
                "--database-url" | "-d" => {
                    if let Some(val) = args.next() {
                        database_url = Some(val);
                    } else {
                        return Err(eyre!("--database-url requires a value"));
                    }
                }
                _ => {}
            }
        }

        Ok(Self {
            socket,
            database_url,
        })
    }
}
