# Requirements Document

## Introduction

This micro SaaS application provides a simple yet powerful video editing service that allows users to overlay custom frames onto their videos at specific time intervals. The core functionality centers around the FFmpeg-based frame overlay feature, enabling users to add branded frames, borders, or decorative elements to their video content through a web interface.

## Requirements

### Requirement 1

**User Story:** As a content creator, I want to upload a video and a custom frame image, or video, so that I can create professional-looking videos with branded overlays.

#### Acceptance Criteria

1. WHEN a user accesses the application THEN the system SHALL display a clean upload interface
2. WHEN a user selects a video file THEN the system SHALL validate the file format and size
3. WHEN a user selects a frame image THEN the system SHALL validate the image format and dimensions
4. WHEN both files are uploaded THEN the system SHALL display a preview of the video and frame

### Requirement 2

**User Story:** As a user, I want to specify when and for how long the frame overlay appears, so that I can control the timing of my branded content.

#### Acceptance Criteria

1. WHEN a user has uploaded both video and frame THEN the system SHALL provide timing controls
2. WHEN a user sets a start time THEN the system SHALL validate it's within the video duration
3. WHEN a user sets a duration THEN the system SHALL ensure it doesn't exceed the remaining video time
4. WHEN timing is set THEN the system SHALL show a preview timeline with overlay indicators

### Requirement 3

**User Story:** As a user, I want to process my video with the custom frame overlay, so that I can download the final result.

#### Acceptance Criteria

1. WHEN a user clicks process THEN the system SHALL execute the FFmpeg command with user parameters
2. WHEN processing starts THEN the system SHALL display progress feedback to the user
3. WHEN processing completes successfully THEN the system SHALL provide a download link
4. WHEN processing fails THEN the system SHALL display clear error messages
5. WHEN the output is ready THEN the system SHALL allow preview before download

### Requirement 4

**User Story:** As a user, I want to manage my processing jobs, so that I can track multiple video projects.

#### Acceptance Criteria

1. WHEN a user starts processing THEN the system SHALL create a unique job identifier
2. WHEN multiple jobs are running THEN the system SHALL display a job queue status
3. WHEN a job completes THEN the system SHALL notify the user and store the result temporarily
4. WHEN a user returns later THEN the system SHALL show their recent job history

### Requirement 5

**User Story:** As a user, I want the service to handle various video formats and sizes efficiently, so that I can work with my existing content.

#### Acceptance Criteria

1. WHEN a user uploads video THEN the system SHALL support common formats (MP4, MOV, AVI)
2. WHEN video is large THEN the system SHALL implement reasonable file size limits
3. WHEN processing different resolutions THEN the system SHALL maintain quality appropriately
4. WHEN frame dimensions don't match video THEN the system SHALL scale appropriately

#### Requirement 6

**User Story** Como usuario, puedo seleccionar entre subir una imagen, o llenar un formulario e introducir texto para el marco (overlay) de color firme sin animación, también escoger entre marcos animados (aquí no sabemos si gif es mejor o video o canvas o webgl??) o finalmente usa videos como marcos también.

#### Acceptance Criteria

1. WHEN a user uploads a video THEN user is presented with overlay frame options, SHALL select animated or static or video (or others according to investigation in next step, design).
