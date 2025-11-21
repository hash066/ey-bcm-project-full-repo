import React, { useState } from "react";

const SiteRiskAssessment = () => {
	const [formData, setFormData] = useState({
		riskCategory: "",
		controlQuestion: "",
		complianceStatus: "",
		address_of_location: "",
		nature_of_occupancy: "",
		building_construction_details: "",
		nature_of_other_occupancies: "",
		total_floors_and_communication: "",
		total_floor_area: "",
		maximum_undivided_area: "",
		floors_occupied: "",
		building_age: "",
		stability_certificate: "",
		fire_noc_availability: "",
		people_working_floor_wise: "",
		max_visitors_peak_day: "",
		business_hours: "",
		power_backup_details: "",
		store_room_stacking: "",
		floor_covering_nature: "",
		false_ceiling_details: "",
		hvac_system_details: "",
		area_passage_around_building: "",
	});

	const [riskAssessment, setRiskAssessment] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				"http://localhost:7000/api/site-risk-assessment",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(formData),
				}
			);
			const data = await res.json();
			setRiskAssessment(data);
		} catch (err) {
			console.error("Error generating site risk assessment:", err);
		}
		setLoading(false);
	};

	const getRiskColor = (severity) => {
		if (!severity) return "bg-gray-700";
		const upper = severity.toUpperCase();
		if (upper.includes("LOW")) return "bg-green-500 text-black";
		if (upper.includes("MEDIUM")) return "bg-yellow-400 text-black";
		if (upper.includes("HIGH")) return "bg-red-500 text-white";
		return "bg-gray-700";
	};

	return (
		<div className="min-h-screen p-6 bg-black text-gray-100">
			<div className="max-w-7xl mx-auto">
				<h2 className="text-3xl font-bold text-emerald-400 mb-2 tracking-wide">
					Site Risk Assessment
				</h2>
				<p className="text-gray-300 mb-6">
					Comprehensive site-specific risk evaluation based on building
					characteristics and safety controls
				</p>

				{/* Input Form */}
				<div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-emerald-400 mb-8">
					<h3 className="text-xl font-bold text-emerald-300 mb-4">
						Site Information
					</h3>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{/* Risk Category & Control */}
						<div className="lg:col-span-2">
							<label className="block text-emerald-300 text-sm mb-2">
								Risk Category
							</label>
							<input
								type="text"
								value={formData.riskCategory}
								onChange={(e) =>
									handleInputChange("riskCategory", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="e.g., Fire Safety"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Compliance Status
							</label>
							<select
								value={formData.complianceStatus}
								onChange={(e) =>
									handleInputChange("complianceStatus", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
							>
								<option value="">Select...</option>
								<option value="Fully Compliant">Fully Compliant</option>
								<option value="Partially Compliant">Partially Compliant</option>
								<option value="Non-Compliant">Non-Compliant</option>
							</select>
						</div>

						<div className="lg:col-span-3">
							<label className="block text-emerald-300 text-sm mb-2">
								Control Question
							</label>
							<textarea
								value={formData.controlQuestion}
								onChange={(e) =>
									handleInputChange("controlQuestion", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								rows="2"
								placeholder="e.g., Is the building equipped with fire extinguishers and sprinklers?"
							/>
						</div>

						{/* Location Details */}
						<div className="lg:col-span-3">
							<label className="block text-emerald-300 text-sm mb-2">
								Address of Location
							</label>
							<input
								type="text"
								value={formData.address_of_location}
								onChange={(e) =>
									handleInputChange("address_of_location", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Full address"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Nature of Occupancy
							</label>
							<input
								type="text"
								value={formData.nature_of_occupancy}
								onChange={(e) =>
									handleInputChange("nature_of_occupancy", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="e.g., Commercial IT Office"
							/>
						</div>

						<div className="lg:col-span-2">
							<label className="block text-emerald-300 text-sm mb-2">
								Building Construction Details
							</label>
							<input
								type="text"
								value={formData.building_construction_details}
								onChange={(e) =>
									handleInputChange(
										"building_construction_details",
										e.target.value
									)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Construction materials and structure type"
							/>
						</div>

						<div className="lg:col-span-3">
							<label className="block text-emerald-300 text-sm mb-2">
								Nature of Other Occupancies
							</label>
							<input
								type="text"
								value={formData.nature_of_other_occupancies}
								onChange={(e) =>
									handleInputChange(
										"nature_of_other_occupancies",
										e.target.value
									)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Other uses in the building"
							/>
						</div>

						{/* Building Specifications */}
						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Total Floors & Communication
							</label>
							<input
								type="text"
								value={formData.total_floors_and_communication}
								onChange={(e) =>
									handleInputChange(
										"total_floors_and_communication",
										e.target.value
									)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="e.g., 12 floors with lifts"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Total Floor Area
							</label>
							<input
								type="text"
								value={formData.total_floor_area}
								onChange={(e) =>
									handleInputChange("total_floor_area", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="e.g., 300,000 sq. ft."
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Maximum Undivided Area
							</label>
							<input
								type="text"
								value={formData.maximum_undivided_area}
								onChange={(e) =>
									handleInputChange("maximum_undivided_area", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Largest open space"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Floors Occupied
							</label>
							<input
								type="text"
								value={formData.floors_occupied}
								onChange={(e) =>
									handleInputChange("floors_occupied", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Which floors are in use"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Building Age
							</label>
							<input
								type="text"
								value={formData.building_age}
								onChange={(e) =>
									handleInputChange("building_age", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Years since construction"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Stability Certificate
							</label>
							<input
								type="text"
								value={formData.stability_certificate}
								onChange={(e) =>
									handleInputChange("stability_certificate", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Certificate status and date"
							/>
						</div>

						{/* Safety & Occupancy */}
						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Fire NOC Availability
							</label>
							<input
								type="text"
								value={formData.fire_noc_availability}
								onChange={(e) =>
									handleInputChange("fire_noc_availability", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Yes/No and renewal date"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								People Working Floor-wise
							</label>
							<input
								type="text"
								value={formData.people_working_floor_wise}
								onChange={(e) =>
									handleInputChange("people_working_floor_wise", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Approx. employees per floor"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Max Visitors (Peak Day)
							</label>
							<input
								type="text"
								value={formData.max_visitors_peak_day}
								onChange={(e) =>
									handleInputChange("max_visitors_peak_day", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Maximum visitor count"
							/>
						</div>

						<div className="lg:col-span-3">
							<label className="block text-emerald-300 text-sm mb-2">
								Business Hours
							</label>
							<input
								type="text"
								value={formData.business_hours}
								onChange={(e) =>
									handleInputChange("business_hours", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Operating hours and days"
							/>
						</div>

						{/* Infrastructure Details */}
						<div className="lg:col-span-3">
							<label className="block text-emerald-300 text-sm mb-2">
								Power Backup Details
							</label>
							<input
								type="text"
								value={formData.power_backup_details}
								onChange={(e) =>
									handleInputChange("power_backup_details", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Generator and UPS specifications"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Store Room Stacking
							</label>
							<input
								type="text"
								value={formData.store_room_stacking}
								onChange={(e) =>
									handleInputChange("store_room_stacking", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Storage arrangements"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								Floor Covering Nature
							</label>
							<input
								type="text"
								value={formData.floor_covering_nature}
								onChange={(e) =>
									handleInputChange("floor_covering_nature", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Flooring materials"
							/>
						</div>

						<div>
							<label className="block text-emerald-300 text-sm mb-2">
								False Ceiling Details
							</label>
							<input
								type="text"
								value={formData.false_ceiling_details}
								onChange={(e) =>
									handleInputChange("false_ceiling_details", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Ceiling type and materials"
							/>
						</div>

						<div className="lg:col-span-2">
							<label className="block text-emerald-300 text-sm mb-2">
								HVAC System Details
							</label>
							<input
								type="text"
								value={formData.hvac_system_details}
								onChange={(e) =>
									handleInputChange("hvac_system_details", e.target.value)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="HVAC specifications"
							/>
						</div>

						<div className="lg:col-span-3">
							<label className="block text-emerald-300 text-sm mb-2">
								Area/Passage Around Building
							</label>
							<input
								type="text"
								value={formData.area_passage_around_building}
								onChange={(e) =>
									handleInputChange(
										"area_passage_around_building",
										e.target.value
									)
								}
								className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
								placeholder="Emergency access passages"
							/>
						</div>
					</div>

					<div className="mt-6">
						<button
							onClick={handleSubmit}
							disabled={loading}
							className="w-full md:w-auto bg-gradient-to-r from-emerald-400 to-green-500 text-black font-bold px-8 py-3 rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
						>
							{loading ? "Assessing Risk..." : "Generate Site Risk Assessment"}
						</button>
					</div>
				</div>

				{/* Results */}
				{riskAssessment && (
					<div className="space-y-8">
						{/* Risk Overview Card */}
						<div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-emerald-400">
							<h3 className="text-2xl font-bold text-emerald-400 mb-6">
								Risk Assessment Results
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
								<div className="bg-gray-800 p-4 rounded-lg border border-emerald-500">
									<div className="text-emerald-300 text-sm mb-1">Risk ID</div>
									<div className="text-white font-mono font-bold">
										{riskAssessment.risk_id}
									</div>
								</div>
								<div className="bg-gray-800 p-4 rounded-lg border border-emerald-500">
									<div className="text-emerald-300 text-sm mb-1">Category</div>
									<div className="text-white font-semibold">
										{riskAssessment.category}
									</div>
								</div>
								<div className="bg-gray-800 p-4 rounded-lg border border-emerald-500">
									<div className="text-emerald-300 text-sm mb-1">
										Business Unit
									</div>
									<div className="text-white font-semibold">
										{riskAssessment.business_unit}
									</div>
								</div>
								<div className="bg-gray-800 p-4 rounded-lg border border-emerald-500">
									<div className="text-emerald-300 text-sm mb-1">
										Risk Owner
									</div>
									<div className="text-white font-semibold">
										{riskAssessment.risk_owner}
									</div>
								</div>
							</div>

							<div className="bg-black p-5 rounded-lg border border-gray-700 mb-6">
								<h4 className="text-emerald-300 font-bold mb-2">Risk Name</h4>
								<p className="text-white text-lg">{riskAssessment.risk_name}</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
								<div className="bg-black p-5 rounded-lg border border-gray-700">
									<h4 className="text-emerald-300 font-bold mb-2">
										Control Question
									</h4>
									<p className="text-gray-200 text-sm">
										{riskAssessment.question}
									</p>
								</div>
								<div className="bg-black p-5 rounded-lg border border-gray-700">
									<h4 className="text-emerald-300 font-bold mb-2">
										Compliance Status
									</h4>
									<span
										className={`inline-block px-4 py-2 rounded-full font-semibold ${
											riskAssessment.compliance_status === "Fully Compliant"
												? "bg-green-500 text-black"
												: riskAssessment.compliance_status ===
												  "Partially Compliant"
												? "bg-yellow-400 text-black"
												: "bg-red-500 text-white"
										}`}
									>
										{riskAssessment.compliance_status}
									</span>
								</div>
							</div>

							<div className="bg-black p-5 rounded-lg border border-gray-700 mb-6">
								<h4 className="text-emerald-300 font-bold mb-2">
									Identified Threat
								</h4>
								<p className="text-gray-200">
									{riskAssessment.identified_threat}
								</p>
							</div>

							{/* Risk Metrics */}
							<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
								<div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-lg text-center">
									<div className="text-blue-200 text-xs mb-1">Likelihood</div>
									<div className="text-white font-bold text-3xl">
										{riskAssessment.likelihood}
									</div>
								</div>
								<div className="bg-gradient-to-br from-orange-600 to-orange-800 p-4 rounded-lg text-center">
									<div className="text-orange-200 text-xs mb-1">Impact</div>
									<div className="text-white font-bold text-3xl">
										{riskAssessment.impact}
									</div>
								</div>
								<div className="bg-gradient-to-br from-red-600 to-red-800 p-4 rounded-lg text-center">
									<div className="text-red-200 text-xs mb-1">Risk Value</div>
									<div className="text-white font-bold text-3xl">
										{riskAssessment.risk_value}
									</div>
								</div>
								<div className="bg-gray-800 p-4 rounded-lg text-center border border-emerald-500">
									<div className="text-emerald-300 text-xs mb-1">
										Residual Risk
									</div>
									<div
										className={`font-bold text-lg px-2 py-1 rounded ${getRiskColor(
											riskAssessment.residual_risk
										)}`}
									>
										{riskAssessment.residual_risk}
									</div>
								</div>
								<div className="bg-gray-800 p-4 rounded-lg text-center border border-emerald-500">
									<div className="text-emerald-300 text-xs mb-1">Timeline</div>
									<div className="text-white font-semibold">
										{riskAssessment.timeline}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="bg-black p-5 rounded-lg border border-gray-700">
									<h4 className="text-emerald-300 font-bold mb-2">
										Current Control Description
									</h4>
									<p className="text-gray-200 text-sm">
										{riskAssessment.current_control_description}
									</p>
									<div className="mt-3">
										<span className="text-emerald-300 text-sm">Rating: </span>
										<span
											className={`px-3 py-1 rounded-full text-xs font-bold ${
												riskAssessment.current_control_rating === "Good"
													? "bg-green-500 text-black"
													: riskAssessment.current_control_rating === "Fair"
													? "bg-yellow-400 text-black"
													: "bg-red-500 text-white"
											}`}
										>
											{riskAssessment.current_control_rating}
										</span>
									</div>
								</div>
								<div className="bg-black p-5 rounded-lg border border-gray-700">
									<h4 className="text-emerald-300 font-bold mb-2">
										Mitigation Plan
									</h4>
									<p className="text-gray-200 text-sm">
										{riskAssessment.mitigation_plan}
									</p>
								</div>
							</div>
						</div>

						{/* Site Details */}
						{riskAssessment.site_details && (
							<div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-emerald-400">
								<h3 className="text-xl font-bold text-emerald-400 mb-4">
									Site Details
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									<div className="bg-gray-800 p-4 rounded-lg">
										<div className="text-emerald-300 text-sm mb-1">
											Site Name
										</div>
										<div className="text-white font-semibold">
											{riskAssessment.site_details.site_name}
										</div>
									</div>
									<div className="bg-gray-800 p-4 rounded-lg lg:col-span-2">
										<div className="text-emerald-300 text-sm mb-1">Address</div>
										<div className="text-white font-semibold">
											{riskAssessment.site_details.address}
										</div>
									</div>
									<div className="bg-gray-800 p-4 rounded-lg">
										<div className="text-emerald-300 text-sm mb-1">
											Building Type
										</div>
										<div className="text-white font-semibold">
											{riskAssessment.site_details.building_type}
										</div>
									</div>
									<div className="bg-gray-800 p-4 rounded-lg">
										<div className="text-emerald-300 text-sm mb-1">
											Floor Area
										</div>
										<div className="text-white font-semibold">
											{riskAssessment.site_details.floor_area_sq_ft} sq ft
										</div>
									</div>
									<div className="bg-gray-800 p-4 rounded-lg">
										<div className="text-emerald-300 text-sm mb-1">
											Occupancy Type
										</div>
										<div className="text-white font-semibold">
											{riskAssessment.site_details.occupancy_type}
										</div>
									</div>
									<div className="bg-gray-800 p-4 rounded-lg">
										<div className="text-emerald-300 text-sm mb-1">
											Year Built
										</div>
										<div className="text-white font-semibold">
											{riskAssessment.site_details.year_of_construction}
										</div>
									</div>
									<div className="bg-gray-800 p-4 rounded-lg">
										<div className="text-emerald-300 text-sm mb-1">
											Number of Floors
										</div>
										<div className="text-white font-semibold">
											{riskAssessment.site_details.no_of_floors}
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Analysis Summary */}
						<div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-emerald-400">
							<h3 className="text-xl font-bold text-emerald-400 mb-4">
								Risk Analysis Summary
							</h3>

							<div className="bg-black p-5 rounded-lg border border-gray-700 mb-6">
								<h4 className="text-emerald-300 font-bold mb-3">
									Classification Summary
								</h4>
								<p className="text-gray-200">
									{riskAssessment.risk_classification_summary}
								</p>
							</div>

							<div className="bg-black p-5 rounded-lg border border-gray-700 mb-6">
								<h4 className="text-emerald-300 font-bold mb-3">
									Mitigation Suggestions
								</h4>
								<ul className="space-y-2">
									{riskAssessment.mitigation_suggestions?.map(
										(suggestion, i) => (
											<li key={i} className="flex items-start">
												<span className="text-emerald-400 mr-2">•</span>
												<span className="text-gray-200">{suggestion}</span>
											</li>
										)
									)}
								</ul>
							</div>

							{riskAssessment.risk_trends && (
								<div className="bg-black p-5 rounded-lg border border-gray-700">
									<h4 className="text-emerald-300 font-bold mb-3">
										Risk Trends & Observations
									</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
										<div>
											<span className="text-emerald-200 text-sm">
												Top Category:
											</span>
											<span className="text-white font-semibold ml-2">
												{riskAssessment.risk_trends.top_category}
											</span>
										</div>
										<div>
											<span className="text-emerald-200 text-sm">
												Risk Severity:
											</span>
											<span
												className={`ml-2 px-3 py-1 rounded-full font-semibold ${getRiskColor(
													riskAssessment.risk_trends.risk_severity
												)}`}
											>
												{riskAssessment.risk_trends.risk_severity}
											</span>
										</div>
									</div>
									<div>
										<h5 className="text-emerald-200 text-sm mb-2">
											Key Observations:
										</h5>
										<ul className="space-y-2">
											{riskAssessment.risk_trends.observations?.map(
												(obs, i) => (
													<li key={i} className="flex items-start">
														<span className="text-emerald-400 mr-2">→</span>
														<span className="text-gray-200 text-sm">{obs}</span>
													</li>
												)
											)}
										</ul>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default SiteRiskAssessment;
