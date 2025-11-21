"""
Gap analysis calculator for compliance frameworks.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
import re
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Pydantic Models for Type Safety
class AssessmentComment(BaseModel):
    """Model for assessment comment."""
    comment: str = Field(..., description="Comment text")
    reviewer: str = Field(..., description="Reviewer name")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="Comment timestamp")

class GapAnalysisResult(BaseModel):
    """Model for individual gap analysis result."""
    id: str = Field(..., description="Unique identifier for the gap analysis")
    framework: str = Field(..., description="Framework name (e.g., RBI, NIST)")
    domain: str = Field(..., description="Domain or category")
    control_name: str = Field(default="", description="Name of the control")
    control_description: str = Field(default="", description="Description of the control")
    current_score: int = Field(..., ge=0, le=4, description="Current compliance score (0-4)")
    target_score: int = Field(default=4, ge=0, le=4, description="Target compliance score")
    gap_percentage: float = Field(..., ge=0, le=100, description="Gap percentage (0-100)")
    compliance_status: str = Field(..., description="Compliance status")
    priority: str = Field(..., description="Priority level")
    missing_items: List[str] = Field(default_factory=list, description="List of missing items")
    required_actions: List[str] = Field(default_factory=list, description="Required actions to address gaps")
    evidence_required: List[str] = Field(default_factory=list, description="Evidence required for compliance")
    assessment_comments: List[AssessmentComment] = Field(default_factory=list, description="Assessment comments")

class FrameworkControl(BaseModel):
    """Model for framework control definition."""
    id: str
    name: str
    description: str
    domain: str
    requirements: List[str]
    evidence_types: List[str]

class FrameworkDefinition(BaseModel):
    """Model for framework definition."""
    name: str
    version: str
    description: str
    domains: Dict[str, List[FrameworkControl]]

class GapCalculator:
    """Calculator for compliance gaps against various frameworks."""

    def __init__(self, frameworks_path: str = "data/frameworks.json"):
        """
        Initialize the gap calculator.

        Args:
            frameworks_path: Path to frameworks JSON file
        """
        self.frameworks_path = Path(frameworks_path)
        self.frameworks: Dict[str, FrameworkDefinition] = {}
        self.load_frameworks()

    def debug_frameworks_loading(self):
        """Debug method to print frameworks loading information."""
        print(f"DEBUG: Frameworks file path: {self.frameworks_path}")
        print(f"DEBUG: Frameworks file exists: {self.frameworks_path.exists()}")

        if self.frameworks_path.exists():
            try:
                with open(self.frameworks_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    print(f"DEBUG: First 100 chars of frameworks.json: {content[:100]}...")
                    print(f"DEBUG: Frameworks.json file size: {len(content)} characters")
            except Exception as e:
                print(f"DEBUG: Error reading frameworks.json: {str(e)}")

        print(f"DEBUG: Loaded {len(self.frameworks)} frameworks")
        total_controls = sum(len(domain) for framework in self.frameworks.values() for domain in framework.domains.values())
        print(f"DEBUG: Total controls: {total_controls}")

    def load_frameworks(self) -> Dict[str, FrameworkDefinition]:
        """
        Load frameworks from JSON file.

        Returns:
            Dictionary of loaded frameworks

        Raises:
            FileNotFoundError: If frameworks file doesn't exist
            json.JSONDecodeError: If frameworks file is invalid JSON
        """
        try:
            if not self.frameworks_path.exists():
                logger.warning(f"Frameworks file not found: {self.frameworks_path}")
                # Create a sample frameworks file for demonstration
                self._create_sample_frameworks()
                logger.info(f"Created sample frameworks file: {self.frameworks_path}")

            with open(self.frameworks_path, 'r', encoding='utf-8') as f:
                frameworks_data = json.load(f)

            # Handle different JSON formats
            if 'frameworks' in frameworks_data:
                # Array format: {"frameworks": [framework1, framework2, ...]}
                frameworks_list = frameworks_data['frameworks']
                logger.info(f"Loading frameworks from array format, found {len(frameworks_list)} frameworks")
            else:
                # Object format: {"FRAMEWORK_NAME": {...}, ...}
                frameworks_list = [{'id': k, **v} for k, v in frameworks_data.items()]
                logger.info(f"Loading frameworks from object format, found {len(frameworks_list)} frameworks")

            # Parse frameworks
            for framework_data in frameworks_list:
                framework_id = framework_data.get('id', 'unknown')
                try:
                    # Get controls from the framework
                    controls = framework_data.get('controls', [])
                    logger.info(f"Processing framework {framework_id} with {len(controls)} controls")

                    # Group controls by domain
                    domains = {}
                    for control in controls:
                        domain = control.get('domain', 'General')
                        if domain not in domains:
                            domains[domain] = []

                        # Map to FrameworkControl format
                        framework_control = FrameworkControl(
                            id=control['control_id'],
                            name=control.get('control_name', ''),
                            description=control.get('control_description', ''),
                            domain=domain,
                            requirements=[control.get('control_name', '')],  # Use control name as requirement
                            evidence_types=[control.get('control_name', '')]  # Use control name as evidence type
                        )
                        domains[domain].append(framework_control)

                    framework = FrameworkDefinition(
                        name=framework_data.get('name', framework_id),
                        version=framework_data.get('version', '1.0'),
                        description=framework_data.get('description', f'{framework_id} framework'),
                        domains=domains
                    )
                    self.frameworks[framework_id] = framework
                    logger.info(f"Loaded framework: {framework_id} with {len(controls)} controls across {len(domains)} domains")

                except Exception as e:
                    logger.error(f"Error parsing framework {framework_id}: {str(e)}")
                    logger.error(f"Framework data: {framework_data}")
                    continue

            logger.info(f"Loaded {len(self.frameworks)} frameworks")
            return self.frameworks

        except FileNotFoundError:
            raise FileNotFoundError(f"Frameworks file not found: {self.frameworks_path}")
        except json.JSONDecodeError as e:
            raise json.JSONDecodeError(f"Invalid JSON in frameworks file: {str(e)}")
        except Exception as e:
            logger.error(f"Error loading frameworks: {str(e)}")
            raise

    def calculate_gaps(self, extracted_data: Dict[str, Any], frameworks: Optional[List[str]] = None) -> List[GapAnalysisResult]:
        """
        Calculate compliance gaps for extracted data against frameworks.

        Args:
            extracted_data: Data extracted from documents
            frameworks: List of framework names to check against. If None, checks all.

        Returns:
            List of gap analysis results
        """
        print("DEBUG: Starting gap calculation...")

        if not extracted_data or 'text' not in extracted_data:
            logger.warning("No extracted data provided for gap calculation")
            print("DEBUG: No extracted data provided")
            return []

        text_content = extracted_data.get('text', '')
        extracted_controls = extracted_data.get('controls', [])

        print(f"DEBUG: Extracted text length: {len(text_content)} characters")
        print(f"DEBUG: First 200 characters of extracted text: {text_content[:200]}...")
        print(f"DEBUG: Extracted controls found: {len(extracted_controls)}")

        # Determine which frameworks to use
        if frameworks is None:
            frameworks_to_check = list(self.frameworks.keys())
        else:
            frameworks_to_check = [f for f in frameworks if f in self.frameworks]

        if not frameworks_to_check:
            logger.warning(f"No valid frameworks found. Available: {list(self.frameworks.keys())}")
            print(f"DEBUG: No valid frameworks found. Available: {list(self.frameworks.keys())}")
            return []

        print(f"DEBUG: Frameworks to check: {frameworks_to_check}")

        results = []
        total_controls_found = 0
        total_controls_processed = 0

        for framework_name in frameworks_to_check:
            framework = self.frameworks[framework_name]
            print(f"DEBUG: Processing framework: {framework_name}")

            for domain_name, controls in framework.domains.items():
                print(f"DEBUG: Processing domain: {domain_name} with {len(controls)} controls")

                for control in controls:
                    total_controls_processed += 1

                    # Check if control is present in extracted data
                    has_control = self.match_control(text_content, control)

                    if has_control:
                        total_controls_found += 1
                        print(f"DEBUG: Found control: {control.name}")
                    else:
                        print(f"DEBUG: Control not found: {control.name}")

                    # Assess completeness if control is present
                    current_score = 0
                    if has_control:
                        current_score = self.assess_completeness(text_content, control)

                    # Calculate gap metrics
                    target_score = 4  # Standard target score
                    gap_percentage = ((target_score - current_score) / target_score) * 100
                    compliance_status = self.get_compliance_status(current_score, target_score)
                    priority = self.get_priority(gap_percentage)

                    # Identify missing items and required actions
                    missing_items = []
                    required_actions = []

                    if current_score < target_score:
                        missing_items = self.identify_missing_items(control, has_control, current_score)
                        required_actions = self.generate_actions(gap_percentage, control)

                    result = GapAnalysisResult(
                        id=f"{framework_name}_{control.id}",
                        framework=framework_name,
                        domain=domain_name,
                        control_name=control.name,
                        control_description=control.description,
                        current_score=current_score,
                        target_score=target_score,
                        gap_percentage=round(gap_percentage, 2),
                        compliance_status=compliance_status,
                        priority=priority,
                        missing_items=missing_items,
                        required_actions=required_actions,
                        evidence_required=control.evidence_types
                    )

                    results.append(result)

        print(f"DEBUG: Total controls processed: {total_controls_processed}")
        print(f"DEBUG: Total controls found in text: {total_controls_found}")
        print(f"DEBUG: Returning {len(results)} controls to frontend")
        logger.info(f"Calculated {len(results)} gap analysis results")
        return results

    def match_control(self, text: str, control: FrameworkControl) -> bool:
        """
        Enhanced keyword matching to check if control is present in text.

        Args:
            text: Text content to search in
            control: Control definition to match against

        Returns:
            True if control is found, False otherwise
        """
        if not text or not control:
            return False

        # Enhanced keyword matching
        text_lower = text.lower()
        control_keywords = []

        # Extract keywords from control name and description
        control_keywords.extend(re.findall(r'\b\w+\b', control.name.lower()))
        control_keywords.extend(re.findall(r'\b\w+\b', control.description.lower()))

        # Remove common stop words and short words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'}
        control_keywords = [word for word in control_keywords if word not in stop_words and len(word) > 2]

        # Remove duplicates
        control_keywords = list(set(control_keywords))

        # Check if any significant keywords are present
        matches = 0
        for keyword in control_keywords:
            if keyword in text_lower:
                matches += 1

        # Lower threshold for better detection - require at least 20% of keywords to match
        threshold = max(1, len(control_keywords) * 0.2)
        is_match = matches >= threshold

        # Additional check for key phrases (exact matches)
        key_phrases = [
            control.name.lower(),
            control.description.lower()[:50],  # First part of description
        ]

        for phrase in key_phrases:
            if len(phrase) > 10 and phrase in text_lower:
                is_match = True
                break

        return is_match

    def assess_completeness(self, text: str, control: FrameworkControl) -> int:
        """
        Assess completeness of control implementation on a scale of 0-4.

        Args:
            text: Text content to assess
            control: Control definition

        Returns:
            Completeness score (0-4)
        """
        if not self.match_control(text, control):
            return 0

        score = 1  # Base score for presence

        # Check for specific requirements
        text_lower = text.lower()

        for requirement in control.requirements:
            if requirement.lower() in text_lower:
                score += 1

        # Check for evidence indicators
        evidence_indicators = ['documented', 'procedure', 'policy', 'process', 'implemented', 'established']
        evidence_found = sum(1 for indicator in evidence_indicators if indicator in text_lower)

        # Add points for evidence (max 2 points)
        score += min(2, evidence_found)

        return min(4, score)  # Cap at 4

    def get_compliance_status(self, current_score: int, target_score: int) -> str:
        """
        Get compliance status based on current and target scores.

        Args:
            current_score: Current implementation score
            target_score: Target score

        Returns:
            Compliance status string
        """
        if current_score >= target_score:
            return "Compliant"
        elif current_score >= target_score * 0.8:
            return "Partially Compliant"
        elif current_score >= target_score * 0.5:
            return "Minimally Compliant"
        else:
            return "Non-Compliant"

    def get_priority(self, gap_percentage: float) -> str:
        """
        Get priority level based on gap percentage.

        Args:
            gap_percentage: Gap percentage (0-100)

        Returns:
            Priority level string
        """
        if gap_percentage >= 75:
            return "Critical"
        elif gap_percentage >= 50:
            return "High"
        elif gap_percentage >= 25:
            return "Medium"
        else:
            return "Low"

    def identify_missing_items(self, control: FrameworkControl, has_control: bool, current_score: int) -> List[str]:
        """
        Identify missing items based on control requirements.

        Args:
            control: Control definition
            has_control: Whether control is present
            current_score: Current implementation score

        Returns:
            List of missing items
        """
        missing_items = []

        if not has_control:
            missing_items.append(f"Control {control.name} not implemented")
        else:
            # Check which specific requirements are missing
            for requirement in control.requirements:
                # Simple check - can be enhanced with more sophisticated analysis
                if len(requirement) > 10:  # Only check substantial requirements
                    missing_items.append(f"Missing: {requirement}")

        return missing_items

    def generate_actions(self, gap_percentage: float, control: FrameworkControl) -> List[str]:
        """
        Generate required actions based on gap percentage.

        Args:
            gap_percentage: Gap percentage (0-100)
            control: Control definition

        Returns:
            List of required actions
        """
        actions = []

        if gap_percentage >= 75:
            actions.extend([
                f"Immediate implementation required for {control.name}",
                "Assign dedicated resources to address this control",
                "Develop detailed implementation plan"
            ])
        elif gap_percentage >= 50:
            actions.extend([
                f"Plan implementation for {control.name}",
                "Conduct gap assessment and resource planning",
                "Develop remediation roadmap"
            ])
        elif gap_percentage >= 25:
            actions.extend([
                f"Review and enhance {control.name} implementation",
                "Identify specific improvements needed"
            ])
        else:
            actions.append(f"Monitor {control.name} for continuous improvement")

        return actions

    def _create_sample_frameworks(self):
        """Create a sample frameworks file for demonstration."""
        sample_data = {
            "RBI": {
                "name": "RBI Cybersecurity Framework",
                "version": "1.0",
                "description": "Reserve Bank of India Cybersecurity Framework",
                "domains": {
                    "Governance": [
                        {
                            "id": "RBI-GOV-001",
                            "name": "Cybersecurity Policy",
                            "description": "Organization shall have a cybersecurity policy approved by the board",
                            "requirements": [
                                "Board-approved cybersecurity policy",
                                "Annual policy review",
                                "Policy communication to all stakeholders"
                            ],
                            "evidence_types": [
                                "Board meeting minutes",
                                "Approved policy document",
                                "Communication records"
                            ]
                        }
                    ],
                    "Risk Management": [
                        {
                            "id": "RBI-RISK-001",
                            "name": "Risk Assessment",
                            "description": "Regular cybersecurity risk assessments shall be conducted",
                            "requirements": [
                                "Annual risk assessment",
                                "Risk register maintenance",
                                "Risk mitigation plans"
                            ],
                            "evidence_types": [
                                "Risk assessment reports",
                                "Risk register",
                                "Mitigation plan documents"
                            ]
                        }
                    ]
                }
            }
        }

        # Ensure directory exists
        self.frameworks_path.parent.mkdir(parents=True, exist_ok=True)

        # Write sample data
        with open(self.frameworks_path, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, indent=2)

        logger.info(f"Created sample frameworks file at {self.frameworks_path}")
