"""
Pain Recognition Module
Detects pain expressions from facial landmarks using MediaPipe Face Mesh
Based on Facial Action Coding System (FACS) for pain detection
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from enum import Enum


class PainLevel(Enum):
    """Pain severity levels"""
    NONE = 0
    MILD = 1
    MODERATE = 2
    SEVERE = 3


class PainRecognitionEngine:
    """
    Detects pain from facial expressions using facial landmarks
    
    Pain Indicators (based on FACS):
    - Brow lowering (AU4)
    - Orbital tightening/eye squinting (AU6, AU7)
    - Nose wrinkling (AU9)
    - Upper lip raising (AU10)
    - Mouth opening (AU25, AU26, AU27)
    - Eyes closing (reduced eye aspect ratio)
    """
    
    def __init__(self):
        # Pain detection thresholds (calibrated for sensitivity)
        self.thresholds = {
            'eye_aspect_ratio_low': 0.18,      # Eyes squinting/closing
            'mouth_aspect_ratio_high': 0.5,    # Mouth opening
            'brow_distance_low': 0.035,        # Brow lowering/frowning
            'nose_wrinkle_high': 0.015,        # Nose wrinkling
            'lip_corner_down': -0.02,          # Lip corners pulled down
        }
        
        # Temporal smoothing for more stable detection
        self.pain_history = []
        self.history_size = 5  # Number of frames to consider
        
        # Pain persistence tracking
        self.pain_start_time = None
        self.pain_duration_threshold = 1.5  # seconds - pain must persist to trigger alert
    
    def calculate_eye_aspect_ratio(self, eye_landmarks: List[Tuple[float, float]]) -> float:
        """
        Calculate Eye Aspect Ratio (EAR)
        Lower values indicate squinting or closing eyes (pain indicator)
        
        Args:
            eye_landmarks: List of (x, y) coordinates for eye landmarks
            
        Returns:
            Eye aspect ratio value
        """
        if len(eye_landmarks) < 6:
            return 0.3  # Default neutral value
        
        # Vertical eye distances
        vertical_1 = np.linalg.norm(np.array(eye_landmarks[1]) - np.array(eye_landmarks[5]))
        vertical_2 = np.linalg.norm(np.array(eye_landmarks[2]) - np.array(eye_landmarks[4]))
        
        # Horizontal eye distance
        horizontal = np.linalg.norm(np.array(eye_landmarks[0]) - np.array(eye_landmarks[3]))
        
        # Calculate EAR
        ear = (vertical_1 + vertical_2) / (2.0 * horizontal + 1e-6)
        return ear
    
    def calculate_mouth_aspect_ratio(self, mouth_landmarks: List[Tuple[float, float]]) -> float:
        """
        Calculate Mouth Aspect Ratio (MAR)
        Higher values indicate mouth opening (potential pain vocalization)
        
        Args:
            mouth_landmarks: List of (x, y) coordinates for mouth landmarks
            
        Returns:
            Mouth aspect ratio value
        """
        if len(mouth_landmarks) < 6:
            return 0.0
        
        # Vertical mouth distances
        vertical_1 = np.linalg.norm(np.array(mouth_landmarks[1]) - np.array(mouth_landmarks[5]))
        vertical_2 = np.linalg.norm(np.array(mouth_landmarks[2]) - np.array(mouth_landmarks[4]))
        
        # Horizontal mouth distance
        horizontal = np.linalg.norm(np.array(mouth_landmarks[0]) - np.array(mouth_landmarks[3]))
        
        # Calculate MAR
        mar = (vertical_1 + vertical_2) / (2.0 * horizontal + 1e-6)
        return mar
    
    def calculate_brow_distance(self, left_brow: Tuple[float, float], 
                                 right_brow: Tuple[float, float]) -> float:
        """
        Calculate vertical distance between brows
        Lower values indicate brow lowering/frowning (pain indicator)
        
        Args:
            left_brow: (x, y) coordinates of left brow center
            right_brow: (x, y) coordinates of right brow center
            
        Returns:
            Brow distance value
        """
        # We measure the Y coordinate (vertical position)
        # Lower Y value = brow is higher on face
        avg_brow_y = (left_brow[1] + right_brow[1]) / 2
        return avg_brow_y
    
    def extract_facial_features(self, face_landmarks) -> Optional[Dict[str, float]]:
        """
        Extract pain-relevant features from MediaPipe face landmarks
        
        Args:
            face_landmarks: MediaPipe face mesh landmarks
            
        Returns:
            Dictionary of facial features or None if landmarks unavailable
        """
        if not face_landmarks:
            return None
        
        try:
            # Convert landmarks to list of (x, y) coordinates
            landmarks = [(lm.x, lm.y) for lm in face_landmarks.landmark]
            
            # Define key landmark indices (MediaPipe Face Mesh indices)
            # Left eye: 33, 160, 158, 133, 153, 144
            left_eye = [landmarks[i] for i in [33, 160, 158, 133, 153, 144]]
            
            # Right eye: 362, 385, 387, 263, 373, 380
            right_eye = [landmarks[i] for i in [362, 385, 387, 263, 373, 380]]
            
            # Mouth: 61, 291, 0, 17, 84, 314
            mouth = [landmarks[i] for i in [61, 291, 0, 17, 84, 314]]
            
            # Brows: left brow (70), right brow (300)
            left_brow = landmarks[70]
            right_brow = landmarks[300]
            
            # Nose bridge reference (6)
            nose_bridge = landmarks[6]
            
            # Calculate features
            left_ear = self.calculate_eye_aspect_ratio(left_eye)
            right_ear = self.calculate_eye_aspect_ratio(right_eye)
            avg_ear = (left_ear + right_ear) / 2
            
            mar = self.calculate_mouth_aspect_ratio(mouth)
            
            brow_dist = self.calculate_brow_distance(left_brow, right_brow)
            
            # Brow to nose distance (indicates brow lowering)
            brow_nose_dist = abs(nose_bridge[1] - ((left_brow[1] + right_brow[1]) / 2))
            
            return {
                'eye_aspect_ratio': avg_ear,
                'mouth_aspect_ratio': mar,
                'brow_distance': brow_dist,
                'brow_nose_distance': brow_nose_dist,
            }
        
        except Exception as e:
            print(f"Error extracting facial features: {e}")
            return None
    
    def detect_pain(self, face_landmarks, timestamp: Optional[float] = None) -> Dict[str, any]:
        """
        Detect pain from facial landmarks
        
        Args:
            face_landmarks: MediaPipe face mesh landmarks
            timestamp: Current timestamp for temporal tracking
            
        Returns:
            Dictionary containing:
                - pain_detected: bool
                - pain_level: PainLevel enum
                - pain_score: float (0-1)
                - pain_indicators: list of active pain indicators
                - confidence: float (0-1)
        """
        features = self.extract_facial_features(face_landmarks)
        
        if not features:
            return {
                'pain_detected': False,
                'pain_level': PainLevel.NONE,
                'pain_score': 0.0,
                'pain_indicators': [],
                'confidence': 0.0,
            }
        
        # Detect individual pain indicators
        pain_indicators = []
        pain_scores = []
        
        # 1. Eye squinting/closing
        if features['eye_aspect_ratio'] < self.thresholds['eye_aspect_ratio_low']:
            pain_indicators.append('eye_squint')
            # Score based on how much below threshold
            score = (self.thresholds['eye_aspect_ratio_low'] - features['eye_aspect_ratio']) / 0.1
            pain_scores.append(min(score, 1.0))
        
        # 2. Mouth opening (potential pain vocalization)
        if features['mouth_aspect_ratio'] > self.thresholds['mouth_aspect_ratio_high']:
            pain_indicators.append('mouth_open')
            score = (features['mouth_aspect_ratio'] - self.thresholds['mouth_aspect_ratio_high']) / 0.3
            pain_scores.append(min(score, 1.0))
        
        # 3. Brow lowering/frowning
        if features['brow_nose_distance'] < self.thresholds['brow_distance_low']:
            pain_indicators.append('brow_lowering')
            score = (self.thresholds['brow_distance_low'] - features['brow_nose_distance']) / 0.02
            pain_scores.append(min(score, 1.0))
        
        # Calculate overall pain score
        if pain_scores:
            pain_score = np.mean(pain_scores)
        else:
            pain_score = 0.0
        
        # Add to history for temporal smoothing
        self.pain_history.append(pain_score)
        if len(self.pain_history) > self.history_size:
            self.pain_history.pop(0)
        
        # Smoothed pain score (reduces false positives)
        smoothed_pain_score = np.mean(self.pain_history)
        
        # Determine pain level based on smoothed score
        pain_detected = False
        pain_level = PainLevel.NONE
        
        if smoothed_pain_score >= 0.7:
            pain_detected = True
            pain_level = PainLevel.SEVERE
        elif smoothed_pain_score >= 0.5:
            pain_detected = True
            pain_level = PainLevel.MODERATE
        elif smoothed_pain_score >= 0.3:
            pain_detected = True
            pain_level = PainLevel.MILD
        
        # Calculate confidence based on number of indicators
        confidence = min(len(pain_indicators) / 3.0, 1.0)
        
        return {
            'pain_detected': pain_detected,
            'pain_level': pain_level,
            'pain_score': round(smoothed_pain_score, 2),
            'pain_indicators': pain_indicators,
            'confidence': round(confidence, 2),
            'features': features,  # Include raw features for debugging
        }
    
    def should_alert(self, pain_result: Dict, current_time: float) -> bool:
        """
        Determine if a pain alert should be triggered
        Only alert if pain persists for threshold duration
        
        Args:
            pain_result: Result from detect_pain()
            current_time: Current timestamp
            
        Returns:
            True if alert should be triggered
        """
        if pain_result['pain_detected'] and pain_result['pain_level'] != PainLevel.NONE:
            if self.pain_start_time is None:
                self.pain_start_time = current_time
            
            duration = current_time - self.pain_start_time
            
            # Trigger alert if pain persists
            if duration >= self.pain_duration_threshold:
                return True
        else:
            # Reset timer if no pain detected
            self.pain_start_time = None
        
        return False
    
    def reset(self):
        """Reset pain detection state"""
        self.pain_history = []
        self.pain_start_time = None
    
    def get_pain_message(self, pain_level: PainLevel, language: str = 'vi') -> str:
        """
        Get user-friendly pain message
        
        Args:
            pain_level: Detected pain level
            language: 'vi' for Vietnamese, 'en' for English
            
        Returns:
            Pain message string
        """
        if language == 'vi':
            messages = {
                PainLevel.NONE: "Không có dấu hiệu đau",
                PainLevel.MILD: "⚠️ Phát hiện biểu hiện đau nhẹ",
                PainLevel.MODERATE: "⚠️ Phát hiện biểu hiện đau trung bình",
                PainLevel.SEVERE: "🚨 Phát hiện biểu hiện đau nghiêm trọng - Dừng tập ngay!",
            }
        else:
            messages = {
                PainLevel.NONE: "No pain detected",
                PainLevel.MILD: "⚠️ Mild pain detected",
                PainLevel.MODERATE: "⚠️ Moderate pain detected",
                PainLevel.SEVERE: "🚨 Severe pain detected - Stop immediately!",
            }
        
        return messages.get(pain_level, "")
