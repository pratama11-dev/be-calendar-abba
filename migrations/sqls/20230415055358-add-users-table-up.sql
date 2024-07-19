/* Replace with your SQL commands */
CREATE TABLE users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  roles VARCHAR(255) DEFAULT 'user' NOT NULL,
  phone VARCHAR(40) DEFAULT NULL,
  PRIMARY KEY (id)
);