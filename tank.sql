DROP PROCEDURE IF EXISTS leader;
DELIMITER $$
CREATE PROCEDURE leader(IN u TEXT, IN s INT)
BEGIN
INSERT INTO leaderboard(username, score) VALUE(u, s);
SELECT * FROM leaderboard ORDER BY score DESC LIMIT 5 ;
END$$