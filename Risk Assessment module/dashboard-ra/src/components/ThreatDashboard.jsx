import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const DOMAIN_OPTIONS = [
	"Environmental",
	"Operational",
	"Manmade",
	"Technological",
	"Financial",
	"Healthcare",
	"Cybersecurity",
];

const CATEGORY_OPTIONS = [
	"Natural Disaster",
	"Equipment Failure",
	"Human Error",
	"Data Breach",
	"Fraud",
	"Pollution",
	"Supply Chain Disruption",
	"Power Outage",
	"Industrial Accident",
	"Regulatory Violation",
];

const ThreatDashboard = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({ domains: [], categories: [] });
	const [threatRisks, setThreatRisks] = useState([
		// Sample data for demonstration
		{
			id: 1,
			domain: "Cybersecurity",
			category: "Data Breach",
			riskName: "Customer Data Exposure",
			threat: "Malicious hackers targeting customer database",
			vulnerability: "Weak encryption protocols",
			likelihood: "8.5",
			impact: "9.2",
			rating: "18.5",
			department: "IT Security",
		},
		{
			id: 2,
			domain: "Environmental",
			category: "Natural Disaster",
			riskName: "Earthquake Damage",
			threat: "Seismic activity in the region",
			vulnerability: "Buildings not earthquake-resistant",
			likelihood: "3.2",
			impact: "8.7",
			rating: "12.1",
			department: "Facilities Management",
		},
		{
			id: 3,
			domain: "Operational",
			category: "Equipment Failure",
			riskName: "Server Downtime",
			threat: "Critical server hardware failure",
			vulnerability: "No redundant backup systems",
			likelihood: "6.8",
			impact: "7.3",
			rating: "14.2",
			department: "Operations",
		},
		{
			id: 4,
			domain: "Financial",
			category: "Fraud",
			riskName: "Payment Fraud",
			threat: "Fraudulent payment transactions",
			vulnerability: "Insufficient transaction monitoring",
			likelihood: "4.5",
			impact: "6.1",
			rating: "10.8",
			department: "Finance",
		},
		{
			id: 5,
			domain: "Healthcare",
			category: "Human Error",
			riskName: "Medical Record Mismanagement",
			threat: "Incorrect patient data entry",
			vulnerability: "Manual data entry processes",
			likelihood: "7.2",
			impact: "5.4",
			rating: "11.7",
			department: "Healthcare Operations",
		},
	]);
	const [loading, setLoading] = useState(false);
	const [hoveredRisk, setHoveredRisk] = useState(null);
	const [selectedRiskIds, setSelectedRiskIds] = useState([]);
	const [enterpriseRisks, setEnterpriseRisks] = useState([]);
	const [loadingEnterprise, setLoadingEnterprise] = useState(false);

	// Handle checkbox change
	const handleCheckboxChange = (field, value) => {
		setFormData((prev) => {
			const currentValues = prev[field];
			if (currentValues.includes(value)) {
				return { ...prev, [field]: currentValues.filter((v) => v !== value) };
			} else {
				return { ...prev, [field]: [...currentValues, value] };
			}
		});
	};

	// Handle risk selection
	const handleRiskSelection = (riskId) => {
		setSelectedRiskIds((prev) => {
			if (prev.includes(riskId)) {
				return prev.filter((id) => id !== riskId);
			} else {
				return [...prev, riskId];
			}
		});
	};

	// Select all risks
	const handleSelectAllRisks = () => {
		setSelectedRiskIds(threatRisks.map((risk) => risk.id));
	};

	// Deselect all risks
	const handleDeselectAllRisks = () => {
		setSelectedRiskIds([]);
	};

	const handleSelectAll = (field, options) => {
		setFormData((prev) => ({ ...prev, [field]: options }));
	};

	const handleDeselectAll = (field) => {
		setFormData((prev) => ({ ...prev, [field]: [] }));
	};

	const handleThreatAnalysis = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				"http://localhost:7000/threat/api/threat-ra/generate-bulk-analysis",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(formData),
				}
			);
			const data = await res.json();
			if (data.success) setThreatRisks(data.threat_risks);
		} catch (err) {
			console.error("Error generating threat risks:", err);
		}
		setLoading(false);
	};

	const handleEnterpriseRiskGeneration = async () => {
		if (selectedRiskIds.length === 0) return;

		setLoadingEnterprise(true);
		setEnterpriseRisks([]);

		try {
			const selectedRisks = threatRisks.filter((risk) =>
				selectedRiskIds.includes(risk.id)
			);

			// Process each selected risk one by one
			for (const risk of selectedRisks) {
				const payload = {
					category: risk.category,
					department: risk.department || "General Operations",
					business_context: `${risk.riskName}: ${risk.threat}`,
					specific_concerns: risk.vulnerability,
					number_of_risks: 1,
				};

				try {
					const res = await fetch(
						"http://localhost:7000/enterprise/api/enterprise-ra/generate-risks",
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(payload),
						}
					);
					const data = await res.json();

					if (data.success && data.risks) {
						setEnterpriseRisks((prev) => [...prev, ...data.risks]);
					}
				} catch (err) {
					console.error(
						`Error generating enterprise risk for ${risk.riskName}:`,
						err
					);
				}
			}
		} catch (err) {
			console.error("Error in enterprise risk generation:", err);
		}

		setLoadingEnterprise(false);
	};

	// Sort threatRisks by decreasing rating
	const sortedThreatRisks = [...threatRisks].sort((a, b) => {
		const numA = Number(a.rating);
		const numB = Number(b.rating);
		if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
		return String(b.rating).localeCompare(String(a.rating));
	});

	// Helper to get rating color class
	const getRatingColor = (rating) => {
		const num = Number(rating);
		if (isNaN(num)) return "bg-gray-800";
		if (num <= 5) return "bg-green-500 text-black";
		if (num <= 10) return "bg-yellow-300 text-black";
		if (num <= 15) return "bg-orange-400 text-black";
		if (num <= 20) return "bg-red-500 text-black";
		return "bg-red-900 text-yellow-100";
	};

	// Export table to Excel
	const exportToExcel = async () => {
		if (!threatRisks.length) return;
		const XLSX = await import("xlsx");

		const headers = [
			"Domain",
			"Category",
			"Risk Name",
			"Threat",
			"Vulnerability",
			"Likelihood",
			"Impact",
			"Rating",
			"Department",
		];

		const data = threatRisks.map((risk) => [
			risk.domain,
			risk.category,
			risk.riskName,
			risk.threat,
			risk.vulnerability,
			risk.likelihood,
			risk.impact,
			risk.rating,
			risk.department || "N/A",
		]);

		const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Threat Risks");

		XLSX.writeFile(workbook, "ThreatRisks.xlsx");
	};

	// Calculate heatmap positioning
	const getHeatmapData = () => {
		if (!sortedThreatRisks.length)
			return { risks: [], maxLikelihood: 10, maxImpact: 10 };

		const validRisks = sortedThreatRisks.filter((risk) => {
			const likelihood = parseFloat(risk.likelihood);
			const impact = parseFloat(risk.impact);
			return !isNaN(likelihood) && !isNaN(impact);
		});

		const maxLikelihood = Math.max(
			...validRisks.map((r) => parseFloat(r.likelihood)),
			10
		);
		const maxImpact = Math.max(
			...validRisks.map((r) => parseFloat(r.impact)),
			10
		);

		const risks = validRisks.map((risk) => {
			const likelihood = parseFloat(risk.likelihood);
			const impact = parseFloat(risk.impact);

			// Add padding (8%) and scale to 84% to keep points visible within boundaries
			const xPercent = Math.max(
				8,
				Math.min(92, (likelihood / maxLikelihood) * 84 + 8)
			);
			const yPercent = Math.max(8, Math.min(92, (impact / maxImpact) * 84 + 8));

			return {
				...risk,
				xPercent,
				yPercent,
				likelihood,
				impact,
			};
		});

		return { risks, maxLikelihood, maxImpact };
	};

	const { risks: heatmapRisks, maxLikelihood, maxImpact } = getHeatmapData();

	return (
		<div className="min-h-screen p-6 bg-black text-gray-100">
			<div className="max-w-7xl mx-auto">
				<h2 className="text-3xl font-bold text-yellow-400 mb-2 tracking-wide">
					Threat Dashboard
				</h2>
				<p className="text-gray-300 mb-6">
					Overview of potential threats in your domain.
				</p>

				<div className="bg-black p-6 rounded-xl shadow-lg border border-gray-800">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Domains */}
						<div className="flex flex-col">
							<div className="flex justify-between items-center mb-2">
								<label className="text-yellow-400 font-semibold">Domains</label>
								<div className="space-x-2">
									<button
										type="button"
										onClick={() => handleSelectAll("domains", DOMAIN_OPTIONS)}
										className="text-sm text-yellow-400 underline hover:text-yellow-300"
									>
										Select All
									</button>
									<button
										type="button"
										onClick={() => handleDeselectAll("domains")}
										className="text-sm text-yellow-400 underline hover:text-yellow-300"
									>
										Deselect All
									</button>
								</div>
							</div>
							<div className="bg-gray-900 p-3 rounded-md max-h-60 overflow-y-auto border border-yellow-400">
								{DOMAIN_OPTIONS.map((domain) => (
									<label
										key={domain}
										className="flex items-center space-x-2 mb-2 cursor-pointer"
									>
										<input
											type="checkbox"
											checked={formData.domains.includes(domain)}
											onChange={() => handleCheckboxChange("domains", domain)}
											className="accent-yellow-400 w-4 h-4"
										/>
										<span>{domain}</span>
									</label>
								))}
							</div>
						</div>

						{/* Categories */}
						<div className="flex flex-col">
							<div className="flex justify-between items-center mb-2">
								<label className="text-yellow-400 font-semibold">
									Categories
								</label>
								<div className="space-x-2">
									<button
										type="button"
										onClick={() =>
											handleSelectAll("categories", CATEGORY_OPTIONS)
										}
										className="text-sm text-yellow-400 underline hover:text-yellow-300"
									>
										Select All
									</button>
									<button
										type="button"
										onClick={() => handleDeselectAll("categories")}
										className="text-sm text-yellow-400 underline hover:text-yellow-300"
									>
										Deselect All
									</button>
								</div>
							</div>
							<div className="bg-gray-900 p-3 rounded-md max-h-60 overflow-y-auto border border-yellow-400">
								{CATEGORY_OPTIONS.map((cat) => (
									<label
										key={cat}
										className="flex items-center space-x-2 mb-2 cursor-pointer"
									>
										<input
											type="checkbox"
											checked={formData.categories.includes(cat)}
											onChange={() => handleCheckboxChange("categories", cat)}
											className="accent-yellow-400 w-4 h-4"
										/>
										<span>{cat}</span>
									</label>
								))}
							</div>
						</div>
					</div>

					<div className="flex flex-col md:flex-row md:justify-between items-center mt-6 gap-4">
						<button
							type="button"
							disabled={loading}
							onClick={handleThreatAnalysis}
							className="w-full md:w-auto bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform"
						>
							{loading ? "Generating..." : "Generate Threat Risks"}
						</button>
						<button
							type="button"
							onClick={exportToExcel}
							className="w-full md:w-auto bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform"
						>
							Export to Excel
						</button>
					</div>
				</div>

				{sortedThreatRisks.length > 0 && (
					<>
						<div className="mt-8">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-xl font-bold text-yellow-400">
									Threat Risk Analysis Results
								</h3>
								<div className="flex items-center gap-4 flex-wrap">
									<span className="text-sm text-gray-300">
										{selectedRiskIds.length} selected
									</span>
									<div className="space-x-2">
										<button
											type="button"
											onClick={handleSelectAllRisks}
											className="text-sm text-yellow-400 underline hover:text-yellow-300"
										>
											Select All
										</button>
										<button
											type="button"
											onClick={handleDeselectAllRisks}
											className="text-sm text-yellow-400 underline hover:text-yellow-300"
										>
											Deselect All
										</button>
									</div>
									<button
										type="button"
										disabled={selectedRiskIds.length === 0 || loadingEnterprise}
										onClick={handleEnterpriseRiskGeneration}
										className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{loadingEnterprise
											? "Generating..."
											: "Generate Enterprise Risks"}
									</button>
									<button
										type="button"
										onClick={() => navigate("/site-risk")}
										className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform"
									>
										→ Site Risk
									</button>
								</div>
							</div>

							<div className="overflow-x-auto rounded-xl shadow-lg">
								<table className="min-w-full divide-y divide-gray-700">
									<thead className="bg-gray-950">
										<tr>
											<th className="px-4 py-3 text-left text-yellow-400 uppercase tracking-wider text-sm">
												Select
											</th>
											{[
												"Domain",
												"Category",
												"Risk Name",
												"Threat",
												"Vulnerability",
												"Likelihood",
												"Impact",
												"Rating",
												"Department",
											].map((head) => (
												<th
													key={head}
													className="px-4 py-3 text-left text-yellow-400 uppercase tracking-wider text-sm"
												>
													{head}
												</th>
											))}
										</tr>
									</thead>
									<tbody className="bg-black divide-y divide-gray-700">
										{sortedThreatRisks.map((risk) => (
											<tr
												key={risk.id}
												className={`hover:bg-gray-900 transition-colors ${
													selectedRiskIds.includes(risk.id)
														? "bg-gray-800 border-l-4 border-yellow-400"
														: ""
												}`}
											>
												<td className="px-4 py-2">
													<input
														type="checkbox"
														checked={selectedRiskIds.includes(risk.id)}
														onChange={() => handleRiskSelection(risk.id)}
														className="accent-yellow-400 w-4 h-4"
													/>
												</td>
												<td className="px-4 py-2 text-sm">{risk.domain}</td>
												<td className="px-4 py-2 text-sm">{risk.category}</td>
												<td className="px-4 py-2 text-sm">{risk.riskName}</td>
												<td className="px-4 py-2 text-sm">{risk.threat}</td>
												<td className="px-4 py-2 text-sm">
													{risk.vulnerability}
												</td>
												<td className="px-4 py-2 text-sm">{risk.likelihood}</td>
												<td className="px-4 py-2 text-sm">{risk.impact}</td>
												<td
													className={`px-4 py-2 font-bold rounded text-sm ${getRatingColor(
														risk.rating
													)}`}
												>
													{risk.rating}
												</td>
												<td className="px-4 py-2 text-sm">
													{risk.department || "N/A"}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						{/* Enterprise Risk Results */}
						{enterpriseRisks.length > 0 && (
							<div className="mt-12">
								<div className="flex justify-between items-center mb-6">
									<h3 className="text-2xl font-bold text-purple-400">
										Enterprise Risk Analysis & Mitigation Measures
									</h3>
									<button
										type="button"
										onClick={() =>
											navigate("/process-risk", { state: { enterpriseRisks } })
										}
										className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-transform"
									>
										Continue to Process Risk Assessment →
									</button>
								</div>
								<div className="space-y-6">
									{enterpriseRisks.map((risk, index) => (
										<div
											key={risk.id || index}
											className="bg-gray-900 border border-purple-400 rounded-xl p-6 shadow-lg"
										>
											<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
												{/* Risk Information */}
												<div>
													<h4 className="text-lg font-bold text-purple-300 mb-3">
														{risk.name}
													</h4>
													<div className="space-y-3 text-sm">
														<div>
															<span className="text-purple-200 font-medium">
																Category:
															</span>{" "}
															<span className="text-gray-200">
																{risk.category}
															</span>
														</div>
														<div>
															<span className="text-purple-200 font-medium">
																Department:
															</span>{" "}
															<span className="text-gray-200">
																{risk.department}
															</span>
														</div>
														<div>
															<span className="text-purple-200 font-medium">
																Description:
															</span>
															<p className="text-gray-200 mt-1">
																{risk.description}
															</p>
														</div>
													</div>
												</div>

												{/* Risk Metrics */}
												<div>
													<div className="grid grid-cols-2 gap-4 mb-4">
														<div className="bg-gray-800 p-3 rounded-lg text-center">
															<div className="text-purple-300 font-medium text-xs">
																Likelihood
															</div>
															<div className="text-white font-bold text-xl">
																{risk.likelihood}/10
															</div>
														</div>
														<div className="bg-gray-800 p-3 rounded-lg text-center">
															<div className="text-purple-300 font-medium text-xs">
																Impact
															</div>
															<div className="text-white font-bold text-xl">
																{risk.impact}/10
															</div>
														</div>
													</div>
													<div className="space-y-2 text-xs">
														<div>
															<span className="text-purple-200 font-medium">
																Likelihood Justification:
															</span>
															<p className="text-gray-300 mt-1">
																{risk.likelihood_justification}
															</p>
														</div>
														<div>
															<span className="text-purple-200 font-medium">
																Impact Justification:
															</span>
															<p className="text-gray-300 mt-1">
																{risk.impact_justification}
															</p>
														</div>
													</div>
												</div>
											</div>

											{/* Treatment & Threats */}
											<div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-700">
												<div>
													<h5 className="text-purple-300 font-bold mb-2">
														Treatment & Mitigation
													</h5>
													<p className="text-gray-200 text-sm">
														{risk.treatment}
													</p>
												</div>
												<div>
													<h5 className="text-purple-300 font-bold mb-2">
														Identified Threats
													</h5>
													<div className="space-y-2">
														{risk.threats?.map((threat, threatIndex) => (
															<div
																key={threatIndex}
																className="bg-gray-800 p-3 rounded-lg"
															>
																<div className="text-purple-200 font-medium text-sm">
																	{threat.name}
																</div>
																<p className="text-gray-300 text-xs mt-1">
																	{threat.description}
																</p>
															</div>
														))}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Improved Heatmap Section */}
						<div className="mt-12">
							<h3 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
								Risk Heatmap: Impact vs Likelihood
							</h3>

							<div className="flex flex-col md:flex-row items-center justify-center gap-8">
								{/* Left: Heatmap */}
								<div className="relative w-96 h-96 border-2 border-yellow-400 rounded-lg overflow-hidden bg-black">
									{/* Background Gradient */}
									<div className="absolute inset-0 bg-gradient-to-tr from-green-500 via-yellow-500 to-red-500 opacity-60"></div>

									{/* Grid Lines */}
									{[1, 2, 3, 4].map((i) => (
										<React.Fragment key={i}>
											<div
												className="absolute left-0 right-0 h-px bg-white opacity-40"
												style={{ bottom: `${i * 20}%` }}
											></div>
											<div
												className="absolute top-0 bottom-0 w-px bg-white opacity-40"
												style={{ left: `${i * 20}%` }}
											></div>
										</React.Fragment>
									))}

									{/* Risk Points */}
									{heatmapRisks.map((risk) => (
										<div
											key={risk.id}
											className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-10"
											style={{
												left: `${risk.xPercent}%`,
												bottom: `${risk.yPercent}%`,
											}}
											onMouseEnter={() => setHoveredRisk(risk)}
											onMouseLeave={() => setHoveredRisk(null)}
										>
											<div
												className={`w-4 h-4 rounded-full border-2 shadow-lg hover:scale-125 transition-all duration-200 ${
													selectedRiskIds.includes(risk.id)
														? "border-yellow-400 bg-yellow-400"
														: "border-white bg-black"
												}`}
											></div>
										</div>
									))}

									{/* Axis Labels */}
									<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 text-yellow-400 font-semibold text-lg">
										Likelihood →
									</div>
									<div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 -rotate-90 text-yellow-400 font-semibold text-lg">
										Impact →
									</div>
								</div>

								{/* Right: Preview Panel */}
								<div className="w-80 min-h-[384px] bg-gray-900 border-2 border-yellow-400 rounded-lg p-4">
									{hoveredRisk ? (
										<>
											<div className="text-yellow-400 font-bold text-lg mb-2 border-b border-yellow-400 pb-1">
												{hoveredRisk.riskName}
											</div>
											<div className="text-sm space-y-2">
												<div className="flex">
													<span className="text-yellow-300 font-medium w-20">
														Domain:
													</span>
													<span className="text-gray-200">
														{hoveredRisk.domain}
													</span>
												</div>
												<div className="flex">
													<span className="text-yellow-300 font-medium w-20">
														Category:
													</span>
													<span className="text-gray-200">
														{hoveredRisk.category}
													</span>
												</div>
												<div className="flex flex-col">
													<span className="text-yellow-300 font-medium">
														Threat:
													</span>
													<span className="text-gray-200 text-xs ml-2">
														{hoveredRisk.threat}
													</span>
												</div>
												<div className="flex flex-col">
													<span className="text-yellow-300 font-medium">
														Vulnerability:
													</span>
													<span className="text-gray-200 text-xs ml-2">
														{hoveredRisk.vulnerability}
													</span>
												</div>
												<div className="grid grid-cols-2 gap-4 mt-3 pt-2 border-t border-gray-700">
													<div className="text-center">
														<span className="text-yellow-300 font-medium text-xs block">
															Likelihood
														</span>
														<span className="text-white font-bold text-lg">
															{hoveredRisk.likelihood}
														</span>
													</div>
													<div className="text-center">
														<span className="text-yellow-300 font-medium text-xs block">
															Impact
														</span>
														<span className="text-white font-bold text-lg">
															{hoveredRisk.impact}
														</span>
													</div>
												</div>
												<div
													className={`text-center font-bold mt-3 px-3 py-2 rounded-lg ${getRatingColor(
														hoveredRisk.rating
													)}`}
												>
													Overall Rating: {hoveredRisk.rating}
												</div>
											</div>
										</>
									) : (
										<p className="text-gray-400 text-center mt-20">
											Hover over a point in the heatmap to see details here.
										</p>
									)}
								</div>
							</div>

							{/* Legend */}
							<div className="mt-8 bg-gray-900 p-4 rounded-lg border border-gray-700 flex flex-wrap justify-center items-center gap-6">
								{[
									{ color: "green-500", label: "Low Risk (≤5)" },
									{ color: "yellow-300", label: "Medium Risk (6-10)" },
									{ color: "orange-400", label: "High Risk (11-15)" },
									{ color: "red-500", label: "Critical Risk (16-20)" },
									{ color: "red-900", label: "Extreme Risk (>20)" },
								].map((item) => (
									<div key={item.label} className="flex items-center space-x-2">
										<div
											className={`w-6 h-6 bg-${item.color} rounded-full border-2 border-white`}
										></div>
										<span className="text-sm font-medium">{item.label}</span>
									</div>
								))}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default ThreatDashboard;
