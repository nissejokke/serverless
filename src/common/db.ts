import { Client } from 'https://deno.land/x/mysql@v2.9.0/mod.ts';

export const client = await new Client().connect({
    hostname: "mysql",
    username: "root",
    db: "serverless",
    poolSize: 3, // connection limit
    password: Deno.env.get("DB_PASSWORD"),
});

/**
 * Generate db scripts:
 * 
 * Users:
 CREATE TABLE `Users` (
  `userId` varchar(12) NOT NULL DEFAULT '',
  `email` varchar(42) DEFAULT NULL,
  `password` varchar(256) DEFAULT NULL,
  `salt` varchar(16) DEFAULT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `Index_UsersEmail` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1

* Functions:
CREATE TABLE `Functions` (
  `functionId` varchar(256) NOT NULL,
  `userId` varchar(12) NOT NULL,
  `lastAccessed` datetime DEFAULT NULL,
  `lastUpdated` datetime DEFAULT NULL,
  PRIMARY KEY (`functionId`,`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1
 */