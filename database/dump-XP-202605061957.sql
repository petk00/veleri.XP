-- MySQL dump 10.13  Distrib 9.6.0, for macos26.3 (arm64)
--
-- Host: localhost    Database: XP
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '3f7f5f4a-2d22-11f1-bf15-47002bd9bc24:1-739';

--
-- Table structure for table `AppUser`
--

DROP TABLE IF EXISTS `AppUser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `AppUser` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `fk_role` int NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_appuser_role` (`fk_role`),
  CONSTRAINT `fk_appuser_role` FOREIGN KEY (`fk_role`) REFERENCES `Role` (`id_role`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AppUser`
--

LOCK TABLES `AppUser` WRITE;
/*!40000 ALTER TABLE `AppUser` DISABLE KEYS */;
INSERT INTO `AppUser` VALUES (1,1,'Admin','User','admin@xp.hr','$2y$10$adminhashplaceholder',1),(2,2,'Ivan','Horvat','ivan.horvat@veleri.hr','$2b$10$1vMqrbK7GXNBNYVLmi.BKeBLUng0PKxoyuY4AlD3wdq8zJvn2Y2pC',1),(3,1,'igor','petkovic','ipetkovic@veleri.hr','$2b$10$m0khb936DXGRgPPkbsxqpuB1oJ87.LG3I2Mf9lIKM1wrAEDEF8KeO',1);
/*!40000 ALTER TABLE `AppUser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Attachment`
--

DROP TABLE IF EXISTS `Attachment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Attachment` (
  `id_attachment` int NOT NULL AUTO_INCREMENT,
  `fk_purchase_request` int NOT NULL,
  `fk_uploaded_by_user` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_attachment`),
  KEY `fk_attachment_request` (`fk_purchase_request`),
  KEY `fk_attachment_user` (`fk_uploaded_by_user`),
  CONSTRAINT `fk_attachment_request` FOREIGN KEY (`fk_purchase_request`) REFERENCES `PurchaseRequest` (`id_purchase_request`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_attachment_user` FOREIGN KEY (`fk_uploaded_by_user`) REFERENCES `AppUser` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Attachment`
--

LOCK TABLES `Attachment` WRITE;
/*!40000 ALTER TABLE `Attachment` DISABLE KEYS */;
INSERT INTO `Attachment` VALUES (1,1,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/1/1776979511736-a1.jpg','image/jpeg','Ponuda','2026-04-23 21:25:11'),(2,1,2,'interview1.docx','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/1/1776979845670-interview1.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Otpremnica','2026-04-23 21:30:45'),(3,2,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/2/1776980059341-a1.jpg','image/jpeg','Ponuda','2026-04-23 21:34:19'),(4,2,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/2/1776980126429-a1.jpg','image/jpeg','Otpremnica','2026-04-23 21:35:26'),(5,4,2,'opis_relacijskog_modela.docx','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/4/1776982983604-opis_relacijskog_modela.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Ponuda','2026-04-23 22:23:03'),(6,4,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/4/1777029802759-a1.jpg','image/jpeg','Otpremnica','2026-04-24 11:23:22'),(7,7,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/7/1777044234043-a1.jpg','image/jpeg','Ponuda','2026-04-24 15:23:54'),(8,8,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/8/1777045110378-a1.jpg','image/jpeg','Ponuda','2026-04-24 15:38:30'),(9,8,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/8/1777045321227-a1.jpg','image/jpeg','Otpremnica','2026-04-24 15:42:01'),(10,9,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/9/1777047652938-a1.jpg','image/jpeg','Ponuda','2026-04-24 16:20:52'),(11,10,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/10/1777047965893-a1.jpg','image/jpeg','Ponuda','2026-04-24 16:26:05'),(12,9,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/9/1777048006963-a1.jpg','image/jpeg','Ponuda','2026-04-24 16:26:46'),(13,9,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/9/1777048015426-a1.jpg','image/jpeg','Otpremnica','2026-04-24 16:26:55'),(14,10,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/10/1777048089397-a1.jpg','image/jpeg','Otpremnica','2026-04-24 16:28:09'),(15,11,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/11/1777052943022-a1.jpg','image/jpeg','Ponuda','2026-04-24 17:49:03'),(16,12,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/12/1777053865825-a1.jpg','image/jpeg','Ponuda','2026-04-24 18:04:25'),(17,13,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/13/1777053995486-a1.jpg','image/jpeg','Ponuda','2026-04-24 18:06:35'),(18,13,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/13/1777054084245-a1.jpg','image/jpeg','Otpremnica','2026-04-24 18:08:04'),(19,12,3,'Screenshot 2026-04-05 at 01.29.32.png','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/12/1777054436910-Screenshot_2026-04-05_at_01.29.32.png','image/png','Otpremnica','2026-04-24 18:13:56'),(20,15,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/15/1777057075494-a1.jpg','image/jpeg','Ponuda','2026-04-24 18:57:55'),(21,16,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/16/1777058236942-a1.jpg','image/jpeg','Ponuda','2026-04-24 19:17:16'),(22,16,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/16/1777058262005-a1.jpg','image/jpeg','Otpremnica','2026-04-24 19:17:42'),(23,14,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/14/1777058412449-a1.jpg','image/jpeg','Ponuda','2026-04-24 19:20:12'),(24,14,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/14/1777058455842-a1.jpg','image/jpeg','Otpremnica','2026-04-24 19:20:55'),(25,17,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/17/1777059105491-a1.jpg','image/jpeg','Ponuda','2026-04-24 19:31:45'),(26,17,2,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/17/1777059152809-a1.jpg','image/jpeg','Otpremnica','2026-04-24 19:32:32'),(27,18,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/18/1777060588463-a1.jpg','image/jpeg','Ponuda','2026-04-24 19:56:28'),(28,18,3,'opis_ev_modela.docx','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/18/1777060687028-opis_ev_modela.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Otpremnica','2026-04-24 19:58:07'),(29,19,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/19/1777060858392-a1.jpg','image/jpeg','Ponuda','2026-04-24 20:00:58'),(30,20,2,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/20/1777061142008-a1.jpg','image/jpeg','Ponuda','2026-04-24 20:05:42'),(31,20,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/20/1777061170843-a1.jpg','image/jpeg','Otpremnica','2026-04-24 20:06:10'),(32,21,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/21/1777061549039-a1.jpg','image/jpeg','Ponuda','2026-04-24 20:12:29'),(33,21,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/21/1777063610169-a1.jpg','image/jpeg','Otpremnica','2026-04-24 20:46:50'),(34,19,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/19/1777064083444-a1.jpg','image/jpeg','Otpremnica','2026-04-24 20:54:43'),(35,23,2,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/23/1777064941486-a1.jpg','image/jpeg','Ponuda','2026-04-24 21:09:01'),(36,23,2,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/23/1777064967113-a1.jpg','image/jpeg','Otpremnica','2026-04-24 21:09:27'),(37,24,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/24/1777065734438-a1.jpg','image/jpeg','Ponuda','2026-04-24 21:22:14'),(38,24,3,'interview1.docx','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/24/1777065753442-interview1.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Otpremnica','2026-04-24 21:22:33'),(39,25,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/25/1777136777706-a1.jpg','image/jpeg','Ponuda','2026-04-25 17:06:17'),(40,26,2,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/26/1777136820518-a1.jpg','image/jpeg','Ponuda','2026-04-25 17:07:00'),(41,26,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/26/1777136888829-a1.jpg','image/jpeg','Otpremnica','2026-04-25 17:08:08'),(42,27,2,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/27/1777137379674-a1.jpg','image/jpeg','Ponuda','2026-04-25 17:16:19'),(43,27,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/27/1777137433489-a1.jpg','image/jpeg','Otpremnica','2026-04-25 17:17:13'),(44,28,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/28/1777138593931-a1.jpg','image/jpeg','Ponuda','2026-04-25 17:36:33'),(45,28,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/28/1777138609965-a1.jpg','image/jpeg','Otpremnica','2026-04-25 17:36:49'),(46,29,2,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/29/1777138748997-a1.jpg','image/jpeg','Ponuda','2026-04-25 17:39:09'),(47,29,3,'a1.jpg','/Users/ip/Desktop/MODULARNO PROGRAMSKO/veleri.XP/server/uploads/attachments/29/1777138801549-a1.jpg','image/jpeg','Otpremnica','2026-04-25 17:40:01'),(48,25,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/25/1777224907856-a1.jpg','image/jpeg','Otpremnica','2026-04-26 17:35:07'),(49,30,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/30/1777225003925-a1.jpg','image/jpeg','Ponuda','2026-04-26 17:36:43'),(50,30,3,'a1.jpg','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/30/1777225059729-a1.jpg','image/jpeg','Otpremnica','2026-04-26 17:37:39'),(51,35,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/35/1777240245515-a1.jpg','image/jpeg','Ponuda','2026-04-26 21:50:45'),(52,37,2,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/37/1777240992602-a1.jpg','image/jpeg','Ponuda','2026-04-26 22:03:12'),(53,37,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/37/1777241155770-a1.jpg','image/jpeg','Otpremnica','2026-04-26 22:05:55'),(54,38,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/38/1777241436568-a1.jpg','image/jpeg','Ponuda','2026-04-26 22:10:36'),(55,38,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/38/1777241455099-a1.jpg','image/jpeg','Otpremnica','2026-04-26 22:10:55'),(56,39,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/39/1777242313003-a1.jpg','image/jpeg','Ponuda','2026-04-26 22:25:13'),(57,39,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/39/1777242330975-a1.jpg','image/jpeg','Otpremnica','2026-04-26 22:25:30'),(58,40,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/40/1777242942896-a1.jpg','image/jpeg','Ponuda','2026-04-26 22:35:42'),(59,40,3,'asdasdasd.pdf','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/40/1777242942902-asdasdasd.pdf','application/pdf','Ponuda','2026-04-26 22:35:42'),(60,40,3,'files.zip','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/40/1777242942911-files.zip','application/zip','Ponuda','2026-04-26 22:35:42'),(61,40,3,'opis_procesa.docx','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/40/1777242942915-opis_procesa.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Ponuda','2026-04-26 22:35:42'),(62,40,3,'asdasdasd.pdf','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/40/1777242996644-asdasdasd.pdf','application/pdf','Otpremnica','2026-04-26 22:36:36'),(63,41,2,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/41/1777287344483-a1.jpg','image/jpeg','Ponuda','2026-04-27 10:55:44'),(64,41,2,'f111iles.zip','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/41/1777287344504-f111iles.zip','application/zip','Ponuda','2026-04-27 10:55:44'),(65,41,2,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/41/1777287438699-a1.jpg','image/jpeg','Otpremnica','2026-04-27 10:57:18'),(66,42,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/42/1777287607399-a1.jpg','image/jpeg','Ponuda','2026-04-27 11:00:07'),(67,42,3,'asdasdasd.pdf','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/42/1777287618583-asdasdasd.pdf','application/pdf','Otpremnica','2026-04-27 11:00:18'),(68,43,2,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/43/1777287957520-a1.jpg','image/jpeg','Ponuda','2026-04-27 11:05:57'),(69,33,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/33/1777293277916-a1.jpg','image/jpeg','Ponuda','2026-04-27 12:34:37'),(70,33,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/33/1777293299425-a1.jpg','image/jpeg','Otpremnica','2026-04-27 12:34:59'),(71,45,2,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/45/1777293464640-a1.jpg','image/jpeg','Ponuda','2026-04-27 12:37:44'),(72,22,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/22/1777294904579-a1.jpg','image/jpeg','Ponuda','2026-04-27 13:01:44'),(73,22,3,'asdasdasd.pdf','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/22/1777294928641-asdasdasd.pdf','application/pdf','Otpremnica','2026-04-27 13:02:08'),(74,11,3,'files.zip','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/11/1777294992525-files.zip','application/zip','Otpremnica','2026-04-27 13:03:12'),(75,46,3,'3_1_3_2_opis_modela_klasa.docx','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/46/1777299139021-3_1_3_2_opis_modela_klasa.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Ponuda','2026-04-27 14:12:19'),(76,46,3,'files.zip','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/46/1777299139030-files.zip','application/zip','Ponuda','2026-04-27 14:12:19'),(77,47,2,'3_1_3_2_opis_modela_klasa.docx','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/47/1777300661233-3_1_3_2_opis_modela_klasa.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Ponuda','2026-04-27 14:37:41'),(78,47,2,'f111iles.zip','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/47/1777300661243-f111iles.zip','application/zip','Ponuda','2026-04-27 14:37:41'),(79,47,3,'3_1_3_2_opis_modela_klasa.docx','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/47/1777300935000-3_1_3_2_opis_modela_klasa.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Otpremnica','2026-04-27 14:42:15'),(80,48,3,'asdasdasd.pdf','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/48/1777301688505-asdasdasd.pdf','application/pdf','Ponuda','2026-04-27 14:54:48'),(81,48,3,'f111iles.zip','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/48/1777301763459-f111iles.zip','application/zip','Otpremnica','2026-04-27 14:56:03'),(82,44,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/44/1777328884001-a1.jpg','image/jpeg','Ponuda','2026-04-27 22:28:04'),(83,44,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/44/1777328960314-a1.jpg','image/jpeg','Otpremnica','2026-04-27 22:29:20'),(84,7,2,'asdasdasd.pdf','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/7/1777329068298-asdasdasd.pdf','application/pdf','Otpremnica','2026-04-27 22:31:08'),(85,49,3,'f111iles.zip','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/49/1777329161930-f111iles.zip','application/zip','Ponuda','2026-04-27 22:32:41'),(86,49,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/49/1777401269977-a1.jpg','image/jpeg','Otpremnica','2026-04-28 18:34:29'),(87,50,3,'3_1_3_2_opis_modela_klasa.docx','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/50/1777468621007-3_1_3_2_opis_modela_klasa.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Ponuda','2026-04-29 13:17:01'),(88,50,3,'asdasdasd.pdf','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/50/1777468633274-asdasdasd.pdf','application/pdf','Otpremnica','2026-04-29 13:17:13'),(89,32,3,'asdasdasd.pdf','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/32/1777469621971-asdasdasd.pdf','application/pdf','Ponuda','2026-04-29 13:33:41'),(90,32,3,'f111iles.zip','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/32/1777469653716-f111iles.zip','application/zip','Otpremnica','2026-04-29 13:34:13'),(91,31,3,'a1.jpg','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/31/1777470851626-a1.jpg','image/jpeg','Ponuda','2026-04-29 13:54:11'),(92,31,3,'asdasdasd.pdf','/Users/ip/Desktop/PROJEKTI/veleri.XP/server/uploads/attachments/31/1777470867110-asdasdasd.pdf','application/pdf','Otpremnica','2026-04-29 13:54:27'),(93,51,2,'3_1_3_2_opis_modela_klasa.docx','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/51/1777839711360-3_1_3_2_opis_modela_klasa.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Ponuda','2026-05-03 20:21:51'),(94,51,2,'3_1_3_2_opis_modela_klasa.docx','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/51/1777839898997-3_1_3_2_opis_modela_klasa.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Otpremnica','2026-05-03 20:24:58'),(95,46,3,'3_1_3_2_opis_modela_klasa.docx','/Users/ip/Desktop/veleri.XP/server/uploads/attachments/46/1777933228352-3_1_3_2_opis_modela_klasa.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','Ponuda','2026-05-04 22:20:28');
/*!40000 ALTER TABLE `Attachment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Department`
--

DROP TABLE IF EXISTS `Department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Department` (
  `id_department` int NOT NULL AUTO_INCREMENT,
  `fk_fiscal_year` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_limit` decimal(14,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_department`),
  KEY `fk_department_fiscalyear` (`fk_fiscal_year`),
  CONSTRAINT `fk_department_fiscalyear` FOREIGN KEY (`fk_fiscal_year`) REFERENCES `FiscalYear` (`id_fiscal_year`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Department`
--

LOCK TABLES `Department` WRITE;
/*!40000 ALTER TABLE `Department` DISABLE KEYS */;
INSERT INTO `Department` VALUES (1,2,'IT',25000.00,1),(2,2,'Nabava',15000.00,1),(3,2,'Računovodstvo',12000.00,1),(4,2,'Odjel za informacijske i komunikacijske tehnologije',10000.00,1),(5,2,'Ekonomat',2000.00,1);
/*!40000 ALTER TABLE `Department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FiscalYear`
--

DROP TABLE IF EXISTS `FiscalYear`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FiscalYear` (
  `id_fiscal_year` int NOT NULL AUTO_INCREMENT,
  `year` int NOT NULL,
  `is_closed` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_fiscal_year`),
  UNIQUE KEY `year` (`year`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FiscalYear`
--

LOCK TABLES `FiscalYear` WRITE;
/*!40000 ALTER TABLE `FiscalYear` DISABLE KEYS */;
INSERT INTO `FiscalYear` VALUES (1,2025,1),(2,2026,0);
/*!40000 ALTER TABLE `FiscalYear` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ItemCategory`
--

DROP TABLE IF EXISTS `ItemCategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItemCategory` (
  `id_item_category` int NOT NULL AUTO_INCREMENT,
  `fk_fiscal_year` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_limit` decimal(14,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_item_category`),
  KEY `fk_itemcategory_fiscalyear` (`fk_fiscal_year`),
  CONSTRAINT `fk_itemcategory_fiscalyear` FOREIGN KEY (`fk_fiscal_year`) REFERENCES `FiscalYear` (`id_fiscal_year`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ItemCategory`
--

LOCK TABLES `ItemCategory` WRITE;
/*!40000 ALTER TABLE `ItemCategory` DISABLE KEYS */;
INSERT INTO `ItemCategory` VALUES (1,2,'Računalna oprema',20000.00,1),(2,2,'Softver',15000.00,1),(3,2,'Uredski materijal',5000.00,1),(4,2,'Namještaj',10000.00,1);
/*!40000 ALTER TABLE `ItemCategory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PurchaseRequest`
--

DROP TABLE IF EXISTS `PurchaseRequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PurchaseRequest` (
  `id_purchase_request` int NOT NULL AUTO_INCREMENT,
  `request_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fk_fiscal_year` int NOT NULL,
  `fk_department` int NOT NULL,
  `fk_request_status` int NOT NULL,
  `fk_created_by_user` int NOT NULL,
  `total_amount` decimal(14,2) DEFAULT NULL,
  `justification` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_purchase_request`),
  UNIQUE KEY `request_number` (`request_number`),
  KEY `fk_purchaserequest_fiscalyear` (`fk_fiscal_year`),
  KEY `fk_purchaserequest_department` (`fk_department`),
  KEY `fk_purchaserequest_status` (`fk_request_status`),
  KEY `fk_purchaserequest_user` (`fk_created_by_user`),
  CONSTRAINT `fk_purchaserequest_department` FOREIGN KEY (`fk_department`) REFERENCES `Department` (`id_department`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_purchaserequest_fiscalyear` FOREIGN KEY (`fk_fiscal_year`) REFERENCES `FiscalYear` (`id_fiscal_year`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_purchaserequest_status` FOREIGN KEY (`fk_request_status`) REFERENCES `RequestStatus` (`id_request_status`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_purchaserequest_user` FOREIGN KEY (`fk_created_by_user`) REFERENCES `AppUser` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PurchaseRequest`
--

LOCK TABLES `PurchaseRequest` WRITE;
/*!40000 ALTER TABLE `PurchaseRequest` DISABLE KEYS */;
INSERT INTO `PurchaseRequest` VALUES (1,'PR-2026-0001',2,1,7,2,3344.00,'dsaddas','2026-04-23 21:21:14','2026-04-23 21:33:14'),(2,'PR-2026-0002',2,2,7,3,231312.00,'312312','2026-04-23 21:34:19','2026-04-23 21:36:12'),(3,'PR-2026-0003',2,2,5,2,NULL,'AI-ja u Zürichu razvili su Ace, prvi sustav fizičke inteligencije koji se u stolnom tenisu ravnopravno nosi s ljudima. Zahvaljujući sustavu kamera koje prate rotaciju loptice i latenciji od svega 10 ms, Ace reagira deset puta brže od čovjeka. Iako je pobijedio elitne amatere u tri od pet mečeva, profesionalci su ga ipak nadmudrili koristeći n AI-ja u Zürichu razvili su Ace, prvi sustav fizičke inteligencije koji se u stolnom tenisu ravnopravno nosi s ljudima. Zahvaljujući sustavu kamera koje prate rotaciju loptice i latenciji od svega 10 ms, Ace reagira deset puta brže od čovjeka. Iako je pobijedio elitne amatere u tri od pet mečeva, profesionalci su ga ipak nadmudrili koristeći n','2026-04-23 21:58:21','2026-04-23 21:59:02'),(4,'PR-2026-0004',2,1,7,2,123444423423.00,'da AI-ja u Zürichu razvili su Ace, prvi sustav fizičke inteligencije koji se u stolnom tenisu ravnopravno nosi s ljudima. Zahvaljujući sustavu kamera koje prate rotaciju loptice i latenciji od svega 10 ms, Ace reagira deset puta brže od čovjeka. Iako je pobijedio elitne amatere u tri od pet mečeva, profesionalci su ga ipak nadmudrili koristeći n','2026-04-23 22:23:03','2026-04-24 14:53:24'),(5,'PR-2026-0005',2,1,3,3,123123.00,'asdasdas','2026-04-24 11:25:31','2026-04-24 15:01:26'),(6,'PR-2026-0006',2,1,5,2,NULL,'opppkpo','2026-04-24 15:01:59','2026-04-24 15:21:35'),(7,'PR-2026-0007',2,1,7,2,324.00,'http://localhost:9000/#/dashboard','2026-04-24 15:23:54','2026-04-29 13:53:14'),(8,'PR-2026-0008',2,1,7,2,1350.00,'ETO','2026-04-24 15:38:30','2026-04-27 13:49:40'),(9,'PR-2026-0009',2,1,7,2,77.00,'asdasdasdasdasdasdasdasd','2026-04-24 16:20:52','2026-04-27 13:49:58'),(10,'PR-2026-0010',2,1,7,2,13000.00,'asdasdaasdasdaasdasdaasdasdaasdasdaasdasda','2026-04-24 16:26:05','2026-04-27 13:50:02'),(11,'PR-2026-0011',2,1,7,2,21312.00,'asdasdasdas','2026-04-24 17:49:03','2026-04-27 13:03:13'),(12,'PR-2026-0012',2,2,7,2,213.00,'asdasdasd','2026-04-24 17:59:38','2026-04-24 18:13:58'),(13,'PR-2026-0013',2,1,7,2,123123.00,'asd','2026-04-24 18:06:35','2026-04-24 18:08:13'),(14,'PR-2026-0014',2,3,7,2,123.00,'asdasasdasdsdasd','2026-04-24 18:16:40','2026-04-27 13:50:06'),(15,'PR-2026-0015',2,1,3,2,23.00,'asdasdas','2026-04-24 18:57:55','2026-04-24 19:02:22'),(16,'PR-2026-0016',2,3,7,2,123.00,'fgdfgfd','2026-04-24 19:08:08','2026-04-27 13:50:20'),(17,'PR-2026-0017',2,3,7,2,43433.00,'eqwee','2026-04-24 19:28:01','2026-04-27 13:50:23'),(18,'PR-2026-0018',2,2,7,3,123.00,'adas','2026-04-24 19:55:55','2026-04-27 13:50:13'),(19,'PR-2026-0019',2,3,7,3,1231.00,'dsa','2026-04-24 20:00:40','2026-04-24 21:07:12'),(20,'PR-2026-0020',2,1,5,2,123.00,'asdasd','2026-04-24 20:04:50','2026-04-24 20:06:16'),(21,'PR-2026-0021',2,3,7,3,123.00,'asdsad','2026-04-24 20:12:15','2026-04-27 14:11:38'),(22,'PR-2026-0022',2,2,7,2,123123123.00,'dasd dasd dasd dasd dasd dasd dasd','2026-04-24 21:08:03','2026-04-27 13:02:12'),(23,'PR-2026-0023',2,2,7,2,1244.00,'asdasd','2026-04-24 21:09:01','2026-04-27 13:01:22'),(24,'PR-2026-0024',2,3,7,2,12.00,'sadasd','2026-04-24 21:18:07','2026-04-27 15:18:03'),(25,'PR-2026-0025',2,1,7,3,123.00,'asd','2026-04-25 17:06:17','2026-04-26 17:35:15'),(26,'PR-2026-0026',2,1,5,2,312.00,'sad','2026-04-25 17:07:00','2026-04-25 17:08:14'),(27,'PR-2026-0027',2,3,5,2,324.00,'sadad','2026-04-25 17:15:33','2026-04-25 17:17:17'),(28,'PR-2026-0028',2,1,5,3,123.00,'asdasdd','2026-04-25 17:36:33','2026-04-25 17:36:52'),(29,'PR-2026-0029',2,1,5,2,123123.00,'asdasdasd','2026-04-25 17:38:36','2026-04-25 17:40:03'),(30,'PR-2026-0030',2,2,7,3,NULL,'asdsadasd','2026-04-26 17:36:24','2026-04-26 17:37:43'),(31,'PR-2026-0031',2,3,7,3,9.00,'sadasd','2026-04-26 17:57:56','2026-04-29 13:54:28'),(32,'PR-2026-0032',2,1,7,3,123.00,'alal','2026-04-26 18:33:50','2026-04-29 13:34:15'),(33,'PR-2026-0033',2,1,7,3,123123.00,'asd','2026-04-26 18:45:07','2026-04-27 12:35:15'),(34,'PR-2026-0034',2,2,5,3,213213213.00,'asdadasdas','2026-04-26 21:48:48','2026-04-26 22:20:55'),(35,'PR-2026-0035',2,2,5,3,123321.00,'adsasdasd asdasdasd','2026-04-26 21:50:45','2026-04-26 22:20:33'),(36,'PR-2026-0036',2,2,5,3,NULL,'asddas','2026-04-26 21:56:24','2026-04-26 22:20:11'),(37,'PR-2026-0037',2,2,7,2,3000.00,'<template>\n  <q-page class=\"page\">\n    <div class=\"page-shell\">\n\n      <!-- Back link -->\n      <button class=\"back-link\" @click=\"goBack\">\n        <q-icon name=\"arrow_back\" size=\"14px\" />\n        <span>Natrag na zahtjeve</span>\n      </button>\n\n      <!-- Loading -->\n      <div v-if=\"loading\" class=\"loading-block\">\n        <q-spinner color=\"primary\" size=\"32px\" />\n      </div>\n\n      <!-- Content -->\n      <div v-else-if=\"request\">\n\n        <!-- ─────────────────────────────\n             Page header\n             ───────────────────────────── -->\n        <header class=\"page-header\">\n          <div class=\"page-header__main\">\n            <div class=\"page-header__eyebrow\">Zahtjev za nabavu</div>\n            <div class=\"page-header__title-row\">\n              <h1 class=\"page-header__title\">{{ request.request_number }}</h1>\n              <span class=\"status\" :class=\"statusClass(request.fk_request_status)\">\n                {{ request.status_name }}\n              </span>\n            </div>','2026-04-26 22:03:12','2026-04-26 22:05:58'),(38,'PR-2026-0038',2,3,7,3,NULL,'sad','2026-04-26 22:10:08','2026-04-26 22:11:08'),(39,'PR-2026-0039',2,1,7,3,111.00,'a','2026-04-26 22:25:12','2026-04-26 22:25:32'),(40,'PR-2026-0040',2,1,7,3,24323423.00,'192.168.1.1192.168.1.1192.168.1.1192.168.1.1192.168.1.1192.168.1.1192.168.1.1192.168.1.1192.168.1.1','2026-04-26 22:35:42','2026-04-27 11:23:24'),(41,'PR-2026-0041',2,1,7,2,231.00,'In talking to engineering management across tech industry heavy-weights, it\'s apparent that software engineering is starting to split people into two nebulous groups:\n\n    The first group will use A.I. to remove drudgery, move faster, and spend more time on the parts of the job that actually matter i.e. framing problems, making tradeoffs, spotting risks, creating clarity, and producing original insight.\n    The second group will use A.I. to avoid thinking. They will paste prompts into a box, collect polished output, and present it as though it reflects their own reasoning. For a while, that can look like productivity. It can even look like talent. But it is a dead end.','2026-04-27 10:55:44','2026-04-27 10:57:28'),(42,'PR-2026-0042',2,2,7,2,NULL,'In talking to engineering management across tech industry heavy-weights, it\'s apparent that software engineering is starting to split people into two nebulous groups:\n\n    The first group will use A.I. to remove drudgery, move faster, and spend more time on the parts of the job that actually matter i.e. framing problems, making tradeoffs, spotting risks, creating clarity, and producing original insight.\n    The second group will use A.I. to avoid thinking. They will paste prompts into a box, collect polished output, and present it as though it reflects their own reasoning. For a while, that can look like productivity. It can even look like talent. But it is a dead end.','2026-04-27 10:59:49','2026-04-27 11:00:20'),(43,'PR-2026-0043',2,2,3,2,213123123.00,'asdasdasdasd dasa dasds','2026-04-27 11:05:57','2026-04-27 11:08:40'),(44,'PR-2026-0044',2,3,7,2,312.00,'xczxcxzc','2026-04-27 11:32:30','2026-04-27 22:29:24'),(45,'PR-2026-0045',2,1,5,2,132.00,'<template>\n  <q-page class=\"page\">\n    <div class=\"page-shell\">\n\n      <!-- Back link -->\n      <button class=\"back-link\" @click=\"goBack\">\n        <q-icon name=\"arrow_back\" size=\"14px\" />\n        <span>Natrag na zahtjeve</span>\n      </button>\n\n      <!-- Loading -->\n      <div v-if=\"loading\" class=\"loading-block\">\n        <q-spinner color=\"primary\" size=\"32px\" />\n      </div>\n\n      <!-- Content -->\n      <div v-else-if=\"request\">\n\n        <!-- Page header -->\n        <header class=\"page-header\">\n          <div class=\"page-header__main\">\n            <div class=\"page-header__eyebrow\">Zahtjev za nabavu</div>\n            <div class=\"page-header__title-row\">\n              <h1 class=\"page-header__title\">{{ request.request_number }}</h1>\n              <span class=\"status\" :class=\"statusClass(request.fk_request_status)\">\n                {{ request.status_name }}\n              </span>\n            </div>\n            <div class=\"page-header__meta\">\n              {{ request.created_by }} · {{ fo','2026-04-27 12:36:36','2026-04-27 22:27:33'),(46,'PR-2026-0046',2,2,3,3,123.02,'dsfssad','2026-04-27 14:12:19','2026-05-04 22:19:48'),(47,'PR-2026-0047',2,1,7,2,7878.00,'predmeti iz ponude','2026-04-27 14:37:41','2026-04-27 15:18:10'),(48,'PR-2026-0048',2,1,7,2,2123.00,'nedodstaka materijala kolegijg it','2026-04-27 14:54:00','2026-04-27 14:56:06'),(49,'PR-2026-0049',2,2,7,2,21.00,'<template>\n  <q-page class=\"page\">\n    <div class=\"page-shell\">\n\n      <!-- Back link -->\n      <button class=\"back-link\" @click=\"goBack\">\n        <q-icon name=\"arrow_back\" size=\"14px\" />\n        <span>Natrag na zahtjeve</span>\n      </button>\n\n      <!-- Loading -->\n      <div v-if=\"loading\" class=\"loading-block\">\n        <q-spinner color=\"primary\" size=\"32px\" />\n      </div>\n\n      <!-- Content -->\n      <div v-else-if=\"request\">\n\n        <!-- Page header -->\n        <header class=\"page-header\">\n          <div class=\"page-header__main\">\n            <div class=\"page-header__eyebrow\">Zahtjev za nabavu</div>\n            <div class=\"page-header__title-row\">\n              <h1 class=\"page-header__title\">{{ request.request_number }}</h1>\n              <span class=\"status\" :class=\"statusClass(request.fk_request_status)\">\n                {{ request.status_name }}\n              </span>\n            </div>\n            <div class=\"page-header__meta\">\n              {{ request.created_by }} · {{ fo','2026-04-27 22:31:39','2026-04-28 18:34:31'),(50,'PR-2026-0050',2,2,7,3,213.00,'asdasd sadasd','2026-04-29 13:17:00','2026-04-29 13:17:16'),(51,'PR-2026-0051',2,1,7,2,2311.00,'@media print {\n  .app-header,\n  .q-header,\n  .toolbar,\n  .mobile-nav {\n    display: none !important;\n  }\n\n  .q-page-container {\n    padding-top: 0 !important;\n    min-height: 0 !important;\n  }\n\n  .q-layout,\n  .q-page-container,\n  .q-page {\n    min-height: 0 !important;\n    height: auto !important;\n  }\n\n  body, .app-layout, .q-layout {\n    background: white !important;\n  }\n}\n\n@media print {\n  .app-header,\n  .q-header,\n  .toolbar,\n  .mobile-nav {\n    display: none !important;\n  }\n\n  .q-page-container {\n    padding-top: 0 !important;\n    min-height: 0 !important;\n  }\n\n  .q-layout,\n  .q-page-container,\n  .q-page {\n    min-height: 0 !important;\n    height: auto !important;\n  }\n\n  body, .app-layout, .q-layout {\n    background: white !important;\n  }\n}\n\nbadlbadlbalbalblablabadlbadlbalbalblablabadlbadlbalbalblablabadlbadlbalbalblabla4','2026-05-03 20:21:51','2026-05-03 20:26:34');
/*!40000 ALTER TABLE `PurchaseRequest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PurchaseRequestItem`
--

DROP TABLE IF EXISTS `PurchaseRequestItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PurchaseRequestItem` (
  `id_purchase_request_item` int NOT NULL AUTO_INCREMENT,
  `fk_purchase_request` int NOT NULL,
  `fk_item_category` int NOT NULL,
  `item_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_purchase_request_item`),
  KEY `fk_pritem_request` (`fk_purchase_request`),
  KEY `fk_pritem_category` (`fk_item_category`),
  CONSTRAINT `fk_pritem_category` FOREIGN KEY (`fk_item_category`) REFERENCES `ItemCategory` (`id_item_category`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pritem_request` FOREIGN KEY (`fk_purchase_request`) REFERENCES `PurchaseRequest` (`id_purchase_request`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PurchaseRequestItem`
--

LOCK TABLES `PurchaseRequestItem` WRITE;
/*!40000 ALTER TABLE `PurchaseRequestItem` DISABLE KEYS */;
INSERT INTO `PurchaseRequestItem` VALUES (2,1,4,'12313',4),(3,2,4,'Namještaj',1),(4,3,4,'aAI x1232',33),(6,4,3,'Uredski materijal',1),(10,5,1,'sadasdasd',1),(11,6,1,'plop',1),(12,7,1,'Računalna oprema',1),(14,8,2,'Softver',1),(15,9,1,'Računalna oprema',1),(16,10,2,'Softver',1),(18,11,4,'Namještaj',1),(20,12,4,'sadasdasd',1),(21,13,1,'Računalna oprema',1),(24,15,2,'Softver',1),(26,16,4,'fdgdgf',1),(28,14,4,'sadasdasd',1),(30,17,4,'asd',1),(32,18,4,'sadasd',1),(34,19,4,'sad',1),(36,20,4,'asdasd',1),(38,21,4,'sadasd',1),(40,23,1,'Računalna oprema',1),(42,24,2,'dsaasd',1),(45,26,4,'Namještaj',1),(46,25,4,'Namještaj',1),(48,27,1,'asdada',1),(49,28,1,'Računalna oprema',1),(51,29,4,'saddasd',1),(52,30,1,'sadasdasd',1),(57,34,4,'sadsdasd',1),(58,35,2,'Softver',1),(59,36,1,'sad',1),(60,36,4,'dsadas',1),(62,37,1,'Računalna oprema',1),(63,38,4,'sadasd',1),(64,38,1,'sadasdas',123),(65,38,1,'sadadasdads',1123),(66,39,1,'Računalna oprema',1),(67,40,2,'Softver',1),(69,41,1,'Računalna oprema',1),(70,42,2,'windows xp',23),(71,43,2,'Softver',1),(73,33,1,'sad',1),(75,45,4,'asdasdas',1),(76,22,2,'sadasd',1),(78,47,2,'Softver',1),(81,48,4,'jkjk',1),(82,48,1,'asdsadd',1),(83,44,4,'dsadasdas',1),(86,49,4,'asdas2q1',3123),(88,50,1,'Računalna oprema',1),(89,32,4,'qaa',1),(90,31,1,'asdas',1),(92,51,3,'Uredski materijal',1),(93,46,1,'Računalna oprema',1);
/*!40000 ALTER TABLE `PurchaseRequestItem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RequestStatus`
--

DROP TABLE IF EXISTS `RequestStatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RequestStatus` (
  `id_request_status` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_request_status`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RequestStatus`
--

LOCK TABLES `RequestStatus` WRITE;
/*!40000 ALTER TABLE `RequestStatus` DISABLE KEYS */;
INSERT INTO `RequestStatus` VALUES (2,'Na odobrenju'),(6,'Naručeno'),(5,'Odbijeno'),(4,'Odobreno'),(1,'Poslano'),(3,'Vraćeno na dopunu / izmjenu'),(7,'Zatvoreno');
/*!40000 ALTER TABLE `RequestStatus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RequestStatusHistory`
--

DROP TABLE IF EXISTS `RequestStatusHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RequestStatusHistory` (
  `id_request_status_history` int NOT NULL AUTO_INCREMENT,
  `fk_purchase_request` int NOT NULL,
  `fk_request_status` int NOT NULL,
  `fk_changed_by_user` int NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_request_status_history`),
  KEY `fk_statushistory_request` (`fk_purchase_request`),
  KEY `fk_statushistory_status` (`fk_request_status`),
  KEY `fk_statushistory_user` (`fk_changed_by_user`),
  CONSTRAINT `fk_statushistory_request` FOREIGN KEY (`fk_purchase_request`) REFERENCES `PurchaseRequest` (`id_purchase_request`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_statushistory_status` FOREIGN KEY (`fk_request_status`) REFERENCES `RequestStatus` (`id_request_status`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_statushistory_user` FOREIGN KEY (`fk_changed_by_user`) REFERENCES `AppUser` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=380 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RequestStatusHistory`
--

LOCK TABLES `RequestStatusHistory` WRITE;
/*!40000 ALTER TABLE `RequestStatusHistory` DISABLE KEYS */;
INSERT INTO `RequestStatusHistory` VALUES (1,1,1,2,'2026-04-23 21:21:14','Zahtjev kreiran i poslan.'),(2,1,2,3,'2026-04-23 21:24:39','Zahtjev poslan na odobrenje.'),(3,1,2,3,'2026-04-23 21:25:11','Dokument dodan: Ponuda - a1.jpg'),(4,1,2,3,'2026-04-23 21:25:34','Zahtjev izmijenjen od strane administratora.'),(5,1,4,3,'2026-04-23 21:25:39','22222'),(6,1,4,2,'2026-04-23 21:30:45','Dokument dodan: Otpremnica - interview1.docx'),(7,1,7,3,'2026-04-23 21:33:14','Zahtjev označen kao završen.'),(8,2,1,3,'2026-04-23 21:34:19','Zahtjev kreiran i poslan.'),(9,2,1,3,'2026-04-23 21:34:19','Dokument dodan: Ponuda - a1.jpg'),(10,2,2,3,'2026-04-23 21:35:13','Zahtjev poslan na odobrenje.'),(11,2,2,3,'2026-04-23 21:35:26','Dokument dodan: Otpremnica - a1.jpg'),(12,2,4,3,'2026-04-23 21:36:04','Zahtjev odobren.'),(13,2,7,3,'2026-04-23 21:36:12','Zahtjev označen kao završen.'),(14,3,1,2,'2026-04-23 21:58:21','Zahtjev kreiran i poslan.'),(15,3,2,3,'2026-04-23 21:58:45','Zahtjev poslan na odobrenje.'),(16,3,5,3,'2026-04-23 21:59:02','s'),(17,4,1,2,'2026-04-23 22:23:03','Zahtjev kreiran i poslan.'),(18,4,1,2,'2026-04-23 22:23:03','Dokument dodan: Ponuda - opis_relacijskog_modela.docx'),(19,4,2,3,'2026-04-23 22:23:35','Zahtjev poslan na odobrenje.'),(20,4,3,3,'2026-04-23 22:23:55','sda'),(21,4,3,3,'2026-04-24 11:23:22','Dokument dodan: Otpremnica - a1.jpg'),(22,4,3,3,'2026-04-24 11:23:59','Zahtjev izmijenjen od strane administratora.'),(23,5,1,3,'2026-04-24 11:25:31','Zahtjev kreiran i poslan.'),(24,5,2,3,'2026-04-24 11:25:38','Zahtjev poslan na odobrenje.'),(25,5,3,3,'2026-04-24 11:25:49','sadasd'),(26,5,3,3,'2026-04-24 11:26:01','Zahtjev izmijenjen od strane administratora.'),(27,4,2,2,'2026-04-24 14:52:48','Zahtjev ponovno poslan na odobravanje nakon ispravke.'),(28,4,4,3,'2026-04-24 14:53:17','Zahtjev odobren.'),(29,4,7,3,'2026-04-24 14:53:24','Zahtjev zatvoren.'),(30,5,3,3,'2026-04-24 15:01:08','Zahtjev izmijenjen od strane administratora.'),(31,5,3,3,'2026-04-24 15:01:26','Zahtjev izmijenjen od strane administratora.'),(32,6,1,2,'2026-04-24 15:01:59','Zahtjev kreiran i poslan.'),(33,6,2,3,'2026-04-24 15:02:21','Zahtjev poslan na odobrenje.'),(34,6,5,3,'2026-04-24 15:21:35','asd'),(35,7,1,2,'2026-04-24 15:23:54','Zahtjev kreiran i poslan.'),(36,7,1,2,'2026-04-24 15:23:54','Dokument dodan: Ponuda - a1.jpg'),(37,7,2,3,'2026-04-24 15:24:15','Zahtjev poslan na odobrenje.'),(38,8,1,2,'2026-04-24 15:38:30','Zahtjev kreiran i poslan.'),(39,8,1,2,'2026-04-24 15:38:30','Dokument dodan: Ponuda - a1.jpg'),(40,8,2,3,'2026-04-24 15:41:27','Zahtjev poslan na odobrenje.'),(41,8,4,3,'2026-04-24 15:41:47','sadasdasd'),(42,8,6,3,'2026-04-24 15:42:01','Dokument dodan: Otpremnica - a1.jpg'),(43,8,6,3,'2026-04-24 15:42:01','Zahtjev automatski postavljen na \"Naručeno\" zbog dodane Otpremnice.'),(44,8,6,3,'2026-04-24 15:46:50','Zahtjev izmijenjen od strane administratora.'),(45,9,1,2,'2026-04-24 16:20:52','Zahtjev kreiran i poslan.'),(46,9,1,2,'2026-04-24 16:20:52','Dokument dodan: Ponuda - a1.jpg'),(47,9,2,3,'2026-04-24 16:21:28','Zahtjev poslan na odobrenje.'),(48,9,4,3,'2026-04-24 16:21:32','bv'),(49,10,1,2,'2026-04-24 16:26:05','Zahtjev kreiran i poslan.'),(50,10,1,2,'2026-04-24 16:26:05','Dokument dodan: Ponuda - a1.jpg'),(51,9,4,3,'2026-04-24 16:26:46','Dokument dodan: Ponuda - a1.jpg'),(52,9,6,3,'2026-04-24 16:26:55','Dokument dodan: Otpremnica - a1.jpg'),(53,9,6,3,'2026-04-24 16:26:55','Zahtjev automatski postavljen na \"Naručeno\" zbog dodane Otpremnice.'),(54,10,2,3,'2026-04-24 16:27:44','Zahtjev poslan na odobrenje.'),(55,10,4,3,'2026-04-24 16:27:50','Zahtjev odobren.'),(56,10,6,3,'2026-04-24 16:28:09','Dokument dodan: Otpremnica - a1.jpg'),(57,10,6,3,'2026-04-24 16:28:09','Zahtjev automatski postavljen na \"Naručeno\" zbog dodane Otpremnice.'),(58,11,1,2,'2026-04-24 17:49:03','Zahtjev kreiran i poslan.'),(59,11,1,2,'2026-04-24 17:49:03','Dokument dodan: Ponuda - a1.jpg'),(60,11,1,3,'2026-04-24 17:49:29','Zahtjev izmijenjen od strane administratora.'),(61,12,1,2,'2026-04-24 17:59:38','Zahtjev kreiran i poslan.'),(62,12,2,3,'2026-04-24 18:03:27','Zahtjev poslan na odobrenje.'),(63,12,3,3,'2026-04-24 18:03:39','sad'),(64,12,3,2,'2026-04-24 18:04:25','Dokument dodan: Ponuda - a1.jpg'),(65,12,3,3,'2026-04-24 18:04:55','Zahtjev izmijenjen od strane administratora.'),(66,13,1,2,'2026-04-24 18:06:35','Zahtjev kreiran i poslan.'),(67,13,1,2,'2026-04-24 18:06:35','Dokument dodan: Ponuda - a1.jpg'),(68,13,2,3,'2026-04-24 18:06:52','Zahtjev poslan na odobrenje.'),(69,13,4,3,'2026-04-24 18:07:53','sad'),(70,13,4,3,'2026-04-24 18:08:04','Dokument dodan: Otpremnica - a1.jpg'),(71,13,7,3,'2026-04-24 18:08:13','Zahtjev označen kao završen.'),(72,12,2,2,'2026-04-24 18:13:18','Zahtjev ponovno poslan na odobravanje nakon ispravke.'),(73,12,4,3,'2026-04-24 18:13:41','burek sa sirom'),(74,12,4,3,'2026-04-24 18:13:56','Dokument dodan: Otpremnica - Screenshot 2026-04-05 at 01.29.32.png'),(75,12,7,3,'2026-04-24 18:13:58','Zahtjev označen kao završen.'),(76,14,1,2,'2026-04-24 18:16:40','Zahtjev kreiran i poslan na odobravanje.'),(77,14,2,3,'2026-04-24 18:17:11','dodaj ponudu i procjenu plz'),(78,15,1,2,'2026-04-24 18:57:55','Zahtjev kreiran i poslan na odobravanje.'),(79,15,1,2,'2026-04-24 18:57:55','Dokument dodan: Ponuda - a1.jpg'),(80,15,2,3,'2026-04-24 18:58:23','wsadsa'),(81,15,3,3,'2026-04-24 19:02:22','sadasd'),(82,16,1,2,'2026-04-24 19:08:08','Zahtjev kreiran i poslan.'),(83,16,2,3,'2026-04-24 19:08:24','Zahtjev poslan na odobrenje.'),(84,16,3,3,'2026-04-24 19:16:50','sadas'),(85,16,3,2,'2026-04-24 19:17:08','Zahtjev izmijenjen od strane korisnika.'),(86,16,3,2,'2026-04-24 19:17:16','Dokument dodan: Ponuda - a1.jpg'),(87,16,2,2,'2026-04-24 19:17:19','Zahtjev ponovno poslan na odobravanje nakon ispravke.'),(88,16,4,3,'2026-04-24 19:17:33','asdasdas'),(89,16,6,3,'2026-04-24 19:17:42','Dokument dodan: Otpremnica - a1.jpg'),(90,16,6,3,'2026-04-24 19:17:42','Zahtjev automatski postavljen na \"Naručeno\" zbog dodane Otpremnice.'),(91,14,3,3,'2026-04-24 19:18:40','DODAJ PONUDU I PARE'),(92,14,3,3,'2026-04-24 19:19:40','Zahtjev izmijenjen od strane administratora.'),(93,14,3,2,'2026-04-24 19:19:56','Zahtjev izmijenjen od strane korisnika.'),(94,14,2,2,'2026-04-24 19:20:02','Zahtjev ponovno poslan na odobravanje nakon ispravke.'),(95,14,2,3,'2026-04-24 19:20:12','Dokument dodan: Ponuda - a1.jpg'),(96,14,4,3,'2026-04-24 19:20:42','Zahtjev odobren.'),(97,14,6,3,'2026-04-24 19:20:55','Dokument dodan: Otpremnica - a1.jpg'),(98,14,6,3,'2026-04-24 19:20:55','Zahtjev automatski postavljen na \"Naručeno\" zbog dodane Otpremnice.'),(99,17,1,2,'2026-04-24 19:28:01','Zahtjev kreiran i poslan.'),(100,17,2,3,'2026-04-24 19:28:14','Zahtjev poslan na odobrenje.'),(101,17,3,3,'2026-04-24 19:30:54','dodaj ponudu i iznos'),(102,17,3,2,'2026-04-24 19:31:30','Zahtjev izmijenjen od strane korisnika.'),(103,17,3,2,'2026-04-24 19:31:45','Dokument dodan: Ponuda - a1.jpg'),(104,17,2,2,'2026-04-24 19:31:56','Zahtjev ponovno poslan na odobravanje nakon ispravke.'),(105,17,4,3,'2026-04-24 19:32:08','sve stima'),(106,17,6,2,'2026-04-24 19:32:32','Dokument dodan: Otpremnica - a1.jpg'),(107,17,6,2,'2026-04-24 19:32:32','Zahtjev automatski postavljen na \"Naručeno\" zbog dodane Otpremnice.'),(108,18,1,3,'2026-04-24 19:55:55','Zahtjev kreiran i poslan na odobravanje.'),(109,18,1,3,'2026-04-24 19:56:28','Dokument dodan: Ponuda - a1.jpg'),(115,18,2,3,'2026-04-24 19:57:52','Zahtjev poslan na odobrenje.'),(116,18,4,3,'2026-04-24 19:57:57','Zahtjev odobren.'),(117,18,6,3,'2026-04-24 19:58:07','Dokument dodan: Otpremnica - opis_ev_modela.docx'),(118,18,6,3,'2026-04-24 19:58:07','Zahtjev automatski postavljen na \"Naručeno\" zbog dodane Otpremnice.'),(119,19,1,3,'2026-04-24 20:00:40','Zahtjev kreiran i poslan na odobravanje.'),(120,19,1,3,'2026-04-24 20:00:58','Dokument dodan: Ponuda - a1.jpg'),(123,20,1,2,'2026-04-24 20:04:50','Zahtjev kreiran i poslan na odobravanje.'),(124,20,2,3,'2026-04-24 20:05:12','sad'),(125,20,2,2,'2026-04-24 20:05:42','Dokument dodan: Ponuda - a1.jpg'),(126,20,1,2,'2026-04-24 20:05:43','Zahtjev ponovno poslan na odobravanje nakon ispravke.'),(127,20,3,3,'2026-04-24 20:05:57','Zahtjev odobren.'),(128,20,3,3,'2026-04-24 20:06:10','Dokument dodan: Otpremnica - a1.jpg'),(129,20,5,3,'2026-04-24 20:06:16','Zahtjev označen kao završen.'),(130,21,1,3,'2026-04-24 20:12:15','Zahtjev kreiran i poslan na odobravanje.'),(131,21,1,3,'2026-04-24 20:12:29','Dokument dodan: Ponuda - a1.jpg'),(148,21,2,3,'2026-04-24 20:46:36','Zahtjev poslan na odobrenje.'),(149,21,4,3,'2026-04-24 20:46:39','sd'),(150,21,6,3,'2026-04-24 20:46:50','Dokument dodan: Otpremnica - a1.jpg'),(151,21,6,3,'2026-04-24 20:46:50','Zahtjev automatski postavljen na \"Naručeno\" zbog dodane Otpremnice.'),(152,19,2,3,'2026-04-24 20:52:25','Zahtjev poslan na odobrenje.'),(153,19,4,3,'2026-04-24 20:52:28','Zahtjev odobren.'),(154,19,6,3,'2026-04-24 20:54:43','Dokument dodan: Otpremnica - a1.jpg'),(155,19,6,3,'2026-04-24 20:54:43','Zahtjev automatski postavljen na \"Naručeno\" zbog dodane Otpremnice.'),(156,19,7,3,'2026-04-24 21:07:12','Zahtjev označen kao završen.'),(157,22,1,2,'2026-04-24 21:08:03','Zahtjev kreiran i poslan.'),(158,23,1,2,'2026-04-24 21:09:01','Zahtjev kreiran i poslan.'),(159,23,1,2,'2026-04-24 21:09:01','Dokument dodan: Ponuda - a1.jpg'),(160,23,1,2,'2026-04-24 21:09:27','Dokument dodan: Otpremnica - a1.jpg'),(161,24,1,2,'2026-04-24 21:18:07','Zahtjev kreiran i poslan.'),(162,24,2,3,'2026-04-24 21:18:25','Zahtjev poslan na odobrenje.'),(163,24,2,3,'2026-04-24 21:22:14','Dokument dodan: Ponuda - a1.jpg'),(164,24,2,3,'2026-04-24 21:22:22','Zahtjev izmijenjen od strane administratora.'),(165,24,4,3,'2026-04-24 21:22:24','Zahtjev odobren.'),(166,24,6,3,'2026-04-24 21:22:33','Dokument dodan: Otpremnica - interview1.docx'),(167,24,6,3,'2026-04-24 21:22:33','Zahtjev automatski postavljen na \"Naručeno\" zbog dodane Otpremnice.'),(168,25,1,3,'2026-04-25 17:06:17','Zahtjev kreiran i poslan.'),(169,25,1,3,'2026-04-25 17:06:17','Dokument dodan: Ponuda - a1.jpg'),(170,25,1,3,'2026-04-25 17:06:36','Zahtjev izmijenjen od strane administratora.'),(171,26,1,2,'2026-04-25 17:07:00','Zahtjev kreiran i poslan.'),(172,26,1,2,'2026-04-25 17:07:00','Dokument dodan: Ponuda - a1.jpg'),(173,26,3,3,'2026-04-25 17:08:00','Zahtjev odobren.'),(174,26,3,3,'2026-04-25 17:08:08','Dokument dodan: Otpremnica - a1.jpg'),(175,26,5,3,'2026-04-25 17:08:14','Zahtjev označen kao završen.'),(176,25,2,3,'2026-04-25 17:14:54','hfgbn'),(177,27,1,2,'2026-04-25 17:15:33','Zahtjev kreiran i poslan na odobravanje.'),(178,27,2,3,'2026-04-25 17:15:43','swadaa'),(179,27,2,2,'2026-04-25 17:16:19','Dokument dodan: Ponuda - a1.jpg'),(180,27,1,2,'2026-04-25 17:16:22','Zahtjev ponovno poslan na odobravanje nakon ispravke.'),(181,27,3,3,'2026-04-25 17:16:39','Zahtjev odobren.'),(182,27,3,3,'2026-04-25 17:17:13','Dokument dodan: Otpremnica - a1.jpg'),(183,27,5,3,'2026-04-25 17:17:17','Zahtjev označen kao završen.'),(184,28,1,3,'2026-04-25 17:36:33','Zahtjev kreiran i poslan na odobravanje.'),(185,28,1,3,'2026-04-25 17:36:33','Dokument dodan: Ponuda - a1.jpg'),(186,28,3,3,'2026-04-25 17:36:40','Zahtjev odobren.'),(187,28,3,3,'2026-04-25 17:36:49','Dokument dodan: Otpremnica - a1.jpg'),(188,28,5,3,'2026-04-25 17:36:52','Zahtjev označen kao završen.'),(189,29,1,2,'2026-04-25 17:38:36','Zahtjev kreiran i poslan na odobravanje.'),(190,29,2,3,'2026-04-25 17:38:45','sadadasdasd'),(191,29,2,2,'2026-04-25 17:39:09','Dokument dodan: Ponuda - a1.jpg'),(192,29,1,2,'2026-04-25 17:39:11','Zahtjev ponovno poslan na odobravanje nakon ispravke.'),(193,29,3,3,'2026-04-25 17:39:26','sadasd'),(194,29,3,3,'2026-04-25 17:40:01','Dokument dodan: Otpremnica - a1.jpg'),(195,29,5,3,'2026-04-25 17:40:03','Zahtjev označen kao završen.'),(196,25,6,3,'2026-04-26 17:34:56','Zahtjev odobren.'),(197,25,6,3,'2026-04-26 17:35:07','Dokument dodan: Otpremnica — a1.jpg'),(198,25,7,3,'2026-04-26 17:35:15','Zahtjev označen kao završen.'),(199,30,1,3,'2026-04-26 17:36:24','Zahtjev kreiran i poslan.'),(200,30,2,3,'2026-04-26 17:36:34','Zahtjev preuzet na obradu.'),(201,30,2,3,'2026-04-26 17:36:43','Dokument dodan: Ponuda — a1.jpg'),(202,30,6,3,'2026-04-26 17:36:54','Zahtjev odobren.'),(203,30,6,3,'2026-04-26 17:37:39','Dokument dodan: Otpremnica — a1.jpg'),(204,30,7,3,'2026-04-26 17:37:43','Zahtjev označen kao završen.'),(205,31,1,3,'2026-04-26 17:57:56','Zahtjev kreiran i poslan na odobravanje.'),(206,32,1,3,'2026-04-26 18:33:50','Zahtjev kreiran i poslan.'),(207,33,1,3,'2026-04-26 18:45:07','Zahtjev kreiran i poslan.'),(208,34,1,3,'2026-04-26 21:48:48','Zahtjev kreiran i poslan.'),(209,34,1,3,'2026-04-26 21:49:42','Zahtjev izmijenjen.'),(210,35,1,3,'2026-04-26 21:50:45','Zahtjev kreiran i poslan.'),(211,35,1,3,'2026-04-26 21:50:45','Dokument dodan: Ponuda — a1.jpg'),(212,36,1,3,'2026-04-26 21:56:24','Zahtjev kreiran i poslan.'),(213,37,1,2,'2026-04-26 22:03:12','Zahtjev kreiran i poslan.'),(214,37,1,2,'2026-04-26 22:03:12','Dokument dodan: Ponuda — a1.jpg'),(215,37,2,3,'2026-04-26 22:04:06','Zahtjev preuzet na obradu.'),(216,37,3,3,'2026-04-26 22:04:24','izbaci flomastere, preskupi su'),(217,37,3,2,'2026-04-26 22:04:56','Zahtjev izmijenjen.'),(218,37,1,2,'2026-04-26 22:05:02','Zahtjev ponovno poslan nakon ispravke.'),(219,37,2,3,'2026-04-26 22:05:31','Zahtjev preuzet na obradu.'),(220,37,6,3,'2026-04-26 22:05:41','ALLES TIMA'),(221,37,6,3,'2026-04-26 22:05:55','Dokument dodan: Otpremnica — a1.jpg'),(222,37,7,3,'2026-04-26 22:05:58','Zahtjev označen kao završen.'),(223,38,1,3,'2026-04-26 22:10:08','Zahtjev kreiran i poslan.'),(224,38,2,3,'2026-04-26 22:10:14','Zahtjev preuzet na obradu.'),(225,38,2,3,'2026-04-26 22:10:36','Dokument dodan: Ponuda — a1.jpg'),(226,38,6,3,'2026-04-26 22:10:43','sadd'),(227,38,6,3,'2026-04-26 22:10:55','Dokument dodan: Otpremnica — a1.jpg'),(228,38,7,3,'2026-04-26 22:11:08','Zahtjev označen kao završen.'),(229,36,2,3,'2026-04-26 22:20:07','Zahtjev preuzet na obradu.'),(230,36,5,3,'2026-04-26 22:20:11','edsfa'),(231,35,2,3,'2026-04-26 22:20:29','Zahtjev preuzet na obradu.'),(232,35,5,3,'2026-04-26 22:20:33','ad'),(233,34,2,3,'2026-04-26 22:20:48','Zahtjev preuzet na obradu.'),(234,34,5,3,'2026-04-26 22:20:55','sad'),(235,39,1,3,'2026-04-26 22:25:12','Zahtjev kreiran i poslan.'),(236,39,1,3,'2026-04-26 22:25:13','Dokument dodan: Ponuda — a1.jpg'),(237,39,2,3,'2026-04-26 22:25:15','Zahtjev preuzet na obradu.'),(238,39,6,3,'2026-04-26 22:25:18','a'),(239,39,6,3,'2026-04-26 22:25:30','Dokument dodan: Otpremnica — a1.jpg'),(240,39,7,3,'2026-04-26 22:25:32','Zahtjev označen kao završen.'),(241,40,1,3,'2026-04-26 22:35:42','Zahtjev kreiran i poslan.'),(242,40,1,3,'2026-04-26 22:35:42','Dokument dodan: Ponuda — a1.jpg'),(243,40,1,3,'2026-04-26 22:35:42','Dokument dodan: Ponuda — asdasdasd.pdf'),(244,40,1,3,'2026-04-26 22:35:42','Dokument dodan: Ponuda — files.zip'),(245,40,1,3,'2026-04-26 22:35:42','Dokument dodan: Ponuda — opis_procesa.docx'),(246,40,2,3,'2026-04-26 22:36:19','Zahtjev preuzet na obradu.'),(247,40,6,3,'2026-04-26 22:36:27','Zahtjev odobren.'),(248,40,6,3,'2026-04-26 22:36:36','Dokument dodan: Otpremnica — asdasdasd.pdf'),(249,41,1,2,'2026-04-27 10:55:44','Zahtjev kreiran i poslan.'),(250,41,1,2,'2026-04-27 10:55:44','Dokument dodan: Ponuda — a1.jpg'),(251,41,1,2,'2026-04-27 10:55:44','Dokument dodan: Ponuda — f111iles.zip'),(252,41,2,3,'2026-04-27 10:56:17','Zahtjev preuzet na obradu.'),(253,41,3,3,'2026-04-27 10:56:32','stavi manju cijenu'),(254,41,3,2,'2026-04-27 10:56:46','Zahtjev izmijenjen.'),(255,41,1,2,'2026-04-27 10:56:47','Zahtjev ponovno poslan nakon ispravke.'),(256,41,2,3,'2026-04-27 10:56:53','Zahtjev preuzet na obradu.'),(257,41,6,3,'2026-04-27 10:56:58','In talking to engineering management across tech industry heavy-weights, it\'s apparent that software engineering is starting to split people into two nebulous groups:\n\n    The first group will use A.I. to remove drudgery, move faster, and spend more time on the parts of the job that actually matter i.e. framing problems, making tradeoffs, spotting risks, creating clarity, and producing original insight.\n    The second group will use A.I. to avoid thinking. They will paste prompts into a box, collect polished output, and present it as though it reflects their own reasoning. For a while, that can look like productivity. It can even look like talent. But it is a dead end.In talking to engineering management across tech industry heavy-weights, it\'s apparent that software engineering is starting to split people into two nebulous groups:\n\n    The first group will use A.I. to remove drudgery, move faster, and spend more time on the parts of the job that actually matter i.e. framing problems, making tradeoffs, spotting risks, creating clarity, and producing original insight.\n    The second group will use A.I. to avoid thinking. They will paste prompts into a box, collect polished output, and present it as though it reflects their own reasoning. For a while, that can look like productivity. It can even look like talent. But it is a dead end.In talking to engineering management across tech industry heavy-weights, it\'s apparent that software engineering is starting to split people into two nebulous groups:\n\n    The first group will use A.I. to remove drudgery, move faster, and spend more time on the parts of the job that actually matter i.e. framing problems, making tradeoffs, spotting risks, creating clarity, and producing original insight.\n    The second group will use A.I. to avoid thinking. They will paste prompts into a box, collect polished output, and present it as though it reflects their own reasoning. For a while, that can look like productivity. It can even look like talent. But it is a dead end.'),(258,41,6,2,'2026-04-27 10:57:18','Dokument dodan: Otpremnica — a1.jpg'),(259,41,7,3,'2026-04-27 10:57:28','Zahtjev označen kao završen.'),(260,42,1,2,'2026-04-27 10:59:49','Zahtjev kreiran i poslan.'),(261,42,2,3,'2026-04-27 10:59:57','Zahtjev preuzet na obradu.'),(262,42,2,3,'2026-04-27 11:00:07','Dokument dodan: Ponuda — a1.jpg'),(263,42,6,3,'2026-04-27 11:00:10','Zahtjev odobren.'),(264,42,6,3,'2026-04-27 11:00:18','Dokument dodan: Otpremnica — asdasdasd.pdf'),(265,42,7,3,'2026-04-27 11:00:20','Zahtjev označen kao završen.'),(266,43,1,2,'2026-04-27 11:05:57','Zahtjev kreiran i poslan.'),(267,43,1,2,'2026-04-27 11:05:57','Dokument dodan: Ponuda — a1.jpg'),(268,43,2,3,'2026-04-27 11:06:24','Zahtjev preuzet na obradu.'),(269,43,3,3,'2026-04-27 11:06:26','dsasdasd'),(270,43,1,2,'2026-04-27 11:06:49','Zahtjev ponovno poslan nakon ispravke.'),(271,43,2,3,'2026-04-27 11:08:37','Zahtjev preuzet na obradu.'),(272,43,3,3,'2026-04-27 11:08:40','sadadas'),(273,40,7,3,'2026-04-27 11:23:24','Zahtjev označen kao završen.'),(274,44,1,2,'2026-04-27 11:32:30','Zahtjev kreiran i poslan.'),(275,33,2,3,'2026-04-27 12:34:26','Zahtjev preuzet na obradu.'),(276,33,2,3,'2026-04-27 12:34:37','Dokument dodan: Ponuda — a1.jpg'),(277,33,6,3,'2026-04-27 12:34:42','Zahtjev odobren.'),(278,33,6,3,'2026-04-27 12:34:59','Dokument dodan: Otpremnica — a1.jpg'),(279,33,6,3,'2026-04-27 12:35:12','Zahtjev izmijenjen.'),(280,33,7,3,'2026-04-27 12:35:15','Zahtjev označen kao završen.'),(281,45,1,2,'2026-04-27 12:36:36','Zahtjev kreiran i poslan.'),(282,45,2,3,'2026-04-27 12:37:03','Zahtjev preuzet na obradu.'),(283,45,3,3,'2026-04-27 12:37:11','dodaj ponudU i cijenu'),(284,45,3,2,'2026-04-27 12:37:44','Dokument dodan: Ponuda — a1.jpg'),(285,45,3,2,'2026-04-27 12:37:59','Zahtjev izmijenjen.'),(286,45,1,2,'2026-04-27 12:38:01','Zahtjev ponovno poslan nakon ispravke.'),(287,23,2,3,'2026-04-27 13:01:19','Zahtjev preuzet na obradu.'),(288,23,6,3,'2026-04-27 13:01:21','Zahtjev odobren.'),(289,23,7,3,'2026-04-27 13:01:22','Zahtjev označen kao završen.'),(290,22,2,3,'2026-04-27 13:01:35','Zahtjev preuzet na obradu.'),(291,22,2,3,'2026-04-27 13:01:44','Dokument dodan: Ponuda — a1.jpg'),(292,22,6,3,'2026-04-27 13:01:50','dsf'),(293,22,6,3,'2026-04-27 13:02:02','Zahtjev izmijenjen.'),(294,22,6,3,'2026-04-27 13:02:08','Dokument dodan: Otpremnica — asdasdasd.pdf'),(295,22,7,3,'2026-04-27 13:02:12','Zahtjev označen kao završen.'),(296,11,2,3,'2026-04-27 13:03:03','Zahtjev preuzet na obradu.'),(297,11,6,3,'2026-04-27 13:03:06','adss'),(298,11,6,3,'2026-04-27 13:03:12','Dokument dodan: Otpremnica — files.zip'),(299,11,7,3,'2026-04-27 13:03:13','Zahtjev označen kao završen.'),(300,8,7,3,'2026-04-27 13:49:40','Zahtjev označen kao završen.'),(301,9,7,3,'2026-04-27 13:49:58','Zahtjev označen kao završen.'),(302,10,7,3,'2026-04-27 13:50:02','Zahtjev označen kao završen.'),(303,14,7,3,'2026-04-27 13:50:06','Zahtjev označen kao završen.'),(304,18,7,3,'2026-04-27 13:50:13','Zahtjev označen kao završen.'),(305,16,7,3,'2026-04-27 13:50:20','Zahtjev označen kao završen.'),(306,17,7,3,'2026-04-27 13:50:23','Zahtjev označen kao završen.'),(307,21,7,3,'2026-04-27 14:11:38','Zahtjev označen kao završen.'),(308,46,1,3,'2026-04-27 14:12:19','Zahtjev kreiran i poslan.'),(309,46,1,3,'2026-04-27 14:12:19','Dokument dodan: Ponuda — 3_1_3_2_opis_modela_klasa.docx'),(310,46,1,3,'2026-04-27 14:12:19','Dokument dodan: Ponuda — files.zip'),(311,47,1,2,'2026-04-27 14:37:41','Zahtjev kreiran i poslan.'),(312,47,1,2,'2026-04-27 14:37:41','Dokument dodan: Ponuda — 3_1_3_2_opis_modela_klasa.docx'),(313,47,1,2,'2026-04-27 14:37:41','Dokument dodan: Ponuda — f111iles.zip'),(314,47,2,3,'2026-04-27 14:39:39','Zahtjev preuzet na obradu.'),(315,47,6,3,'2026-04-27 14:40:31','sve ok'),(316,47,6,3,'2026-04-27 14:42:15','Dokument dodan: Otpremnica — 3_1_3_2_opis_modela_klasa.docx'),(317,48,1,2,'2026-04-27 14:54:00','Zahtjev kreiran i poslan.'),(318,48,2,3,'2026-04-27 14:54:33','Zahtjev preuzet na obradu.'),(319,48,2,3,'2026-04-27 14:54:48','Dokument dodan: Ponuda — asdasdasd.pdf'),(320,48,6,3,'2026-04-27 14:54:56','Zahtjev odobren.'),(321,48,6,3,'2026-04-27 14:55:17','Zahtjev izmijenjen.'),(322,48,6,3,'2026-04-27 14:56:03','Dokument dodan: Otpremnica — f111iles.zip'),(323,48,7,3,'2026-04-27 14:56:06','Zahtjev označen kao završen.'),(324,46,2,3,'2026-04-27 15:16:10','Zahtjev preuzet na obradu.'),(325,24,7,3,'2026-04-27 15:18:03','Zahtjev označen kao završen.'),(326,47,7,3,'2026-04-27 15:18:10','Zahtjev označen kao završen.'),(327,7,6,3,'2026-04-27 16:16:08','Zahtjev odobren.'),(328,32,2,3,'2026-04-27 16:26:38','Zahtjev preuzet na obradu.'),(329,45,5,3,'2026-04-27 22:27:33','lose'),(330,44,2,3,'2026-04-27 22:27:50','Zahtjev preuzet na obradu.'),(331,44,2,3,'2026-04-27 22:28:04','Dokument dodan: Ponuda — a1.jpg'),(332,44,6,3,'2026-04-27 22:28:10','sad'),(333,44,6,3,'2026-04-27 22:29:13','Zahtjev izmijenjen.'),(334,44,6,3,'2026-04-27 22:29:20','Dokument dodan: Otpremnica — a1.jpg'),(335,44,7,3,'2026-04-27 22:29:24','Zahtjev označen kao završen.'),(336,46,3,3,'2026-04-27 22:29:41','123'),(337,46,3,3,'2026-04-27 22:29:52','Zahtjev izmijenjen.'),(338,31,2,3,'2026-04-27 22:30:46','Zahtjev preuzet na obradu.'),(339,7,6,2,'2026-04-27 22:31:08','Dokument dodan: Otpremnica — asdasdasd.pdf'),(340,49,1,2,'2026-04-27 22:31:39','Zahtjev kreiran i poslan.'),(341,49,2,3,'2026-04-27 22:31:50','Zahtjev preuzet na obradu.'),(342,49,3,3,'2026-04-27 22:31:55','FU'),(343,49,1,2,'2026-04-27 22:32:14','Zahtjev ponovno poslan nakon ispravke.'),(344,49,2,3,'2026-04-27 22:32:25','Zahtjev preuzet na obradu.'),(345,49,2,3,'2026-04-27 22:32:41','Dokument dodan: Ponuda — f111iles.zip'),(346,49,6,3,'2026-04-27 22:32:45','sad'),(347,49,6,3,'2026-04-28 18:34:14','Zahtjev izmijenjen.'),(348,49,6,3,'2026-04-28 18:34:29','Dokument dodan: Otpremnica — a1.jpg'),(349,49,7,3,'2026-04-28 18:34:31','Zahtjev označen kao završen.'),(350,46,3,3,'2026-04-28 18:59:26','Zahtjev izmijenjen.'),(351,50,1,3,'2026-04-29 13:17:00','Zahtjev kreiran i poslan.'),(352,50,1,3,'2026-04-29 13:17:01','Dokument dodan: Ponuda — 3_1_3_2_opis_modela_klasa.docx'),(353,50,2,3,'2026-04-29 13:17:04','Zahtjev preuzet na obradu.'),(354,50,6,3,'2026-04-29 13:17:07','das'),(355,50,6,3,'2026-04-29 13:17:13','Dokument dodan: Otpremnica — asdasdasd.pdf'),(356,50,7,3,'2026-04-29 13:17:16','Zahtjev označen kao završen.'),(357,32,2,3,'2026-04-29 13:33:41','Dokument dodan: Ponuda — asdasdasd.pdf'),(358,32,6,3,'2026-04-29 13:33:47','Zahtjev odobren.'),(359,32,6,3,'2026-04-29 13:34:01','Zahtjev izmijenjen.'),(360,32,6,3,'2026-04-29 13:34:13','Dokument dodan: Otpremnica — f111iles.zip'),(361,32,7,3,'2026-04-29 13:34:15','Zahtjev označen kao završen.'),(362,7,7,3,'2026-04-29 13:53:14','Zahtjev označen kao završen.'),(363,31,2,3,'2026-04-29 13:54:11','Dokument dodan: Ponuda — a1.jpg'),(364,31,6,3,'2026-04-29 13:54:13','Zahtjev odobren.'),(365,31,6,3,'2026-04-29 13:54:21','Zahtjev izmijenjen.'),(366,31,6,3,'2026-04-29 13:54:27','Dokument dodan: Otpremnica — asdasdasd.pdf'),(367,31,7,3,'2026-04-29 13:54:28','Zahtjev označen kao završen.'),(368,51,1,2,'2026-05-03 20:21:51','Zahtjev kreiran i poslan.'),(369,51,1,2,'2026-05-03 20:21:51','Dokument dodan: Ponuda — 3_1_3_2_opis_modela_klasa.docx'),(370,51,2,3,'2026-05-03 20:22:21','Zahtjev preuzet na obradu.'),(371,51,3,3,'2026-05-03 20:22:31','dodaj ovo'),(372,51,3,2,'2026-05-03 20:23:26','Zahtjev izmijenjen.'),(373,51,1,2,'2026-05-03 20:23:31','Zahtjev ponovno poslan nakon ispravke.'),(374,51,2,3,'2026-05-03 20:24:16','Zahtjev preuzet na obradu.'),(375,51,6,3,'2026-05-03 20:24:22','Zahtjev odobren.'),(376,51,6,2,'2026-05-03 20:24:59','Dokument dodan: Otpremnica — 3_1_3_2_opis_modela_klasa.docx'),(377,51,7,3,'2026-05-03 20:26:34','Zahtjev označen kao završen.'),(378,46,3,3,'2026-05-04 22:19:48','Zahtjev izmijenjen.'),(379,46,3,3,'2026-05-04 22:20:28','Dokument dodan: Ponuda — 3_1_3_2_opis_modela_klasa.docx');
/*!40000 ALTER TABLE `RequestStatusHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Role`
--

DROP TABLE IF EXISTS `Role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Role` (
  `id_role` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_role`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Role`
--

LOCK TABLES `Role` WRITE;
/*!40000 ALTER TABLE `Role` DISABLE KEYS */;
INSERT INTO `Role` VALUES (1,'Administrator'),(2,'Zaposlenik');
/*!40000 ALTER TABLE `Role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'XP'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-06 19:57:40
