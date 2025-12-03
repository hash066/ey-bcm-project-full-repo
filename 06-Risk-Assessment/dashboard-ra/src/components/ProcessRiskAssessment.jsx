import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const ProcessRiskAssessment = () => {
	const location = useLocation();
	const { enterpriseRisks = [] } = location.state || {};

	const [responses, setResponses] = useState([
		{ category: "", question: "", user_answer: "" },
	]);
	const [processRisks, setProcessRisks] = useState([]);
	const [loading, setLoading] = useState(false);

	// Auto-populate from enterprise risks if available
	useEffect(() => {
		if (enterpriseRisks.length > 0) {
			const initialResponses = enterpriseRisks.map((risk) => ({
				category: risk.category || "",
				question: `How are controls managed for: ${risk.name}?`,
				user_answer: risk.description || "",
			}));
			setResponses(initialResponses);
		}
	}, [enterpriseRisks]);

	const handleResponseChange = (index, field, value) => {
		const updated = [...responses];
		updated[index][field] = value;
		setResponses(updated);
	};

	const addResponse = () => {
		setResponses([...responses, { category: "", question: "", user_answer: "" }]);
	};

	const removeResponse = (index) => {
		setResponses(responses.filter((_, i) => i !== index));
	};

	const handleSubmit = async () => {
		setLoading(true);
		setProcessRisks([]);

		try {
			// Process each response individually
			for (const response of responses) {
				const payload = { responses: [response] };

				const res = await fetch("http://localhost:7000/api/risk-mitigation	", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await res.json();

				if (data.risk_analysis) {
					setProcessRisks((prev) => [...prev, data.risk_analysis]);
				}
			}
		} catch (err) {
			console.error("Error generating process risk analysis:", err);
		}
		setLoading(false);
	};

	const getRiskClassificationColor = (classification) => {
		if (!classification) return "bg-gray-700";
		const upper = classification.toUpperCase();
		if (upper === "L" || upper.includes("LOW")) return "bg-green-500 text-black";
		if (upper === "M" || upper.includes("MEDIUM"))
			return "bg-yellow-400 text-black";
		if (upper === "H" || upper.includes("HIGH")) return "bg-red-500 text-white";
		return "bg-gray-700";
	};

	const exportToExcel = async () => {
		if (!processRisks.length) return;
		const XLSX = await import("xlsx");

		const headers = [
			"Risk ID",
			"Category",
			"Risk Name",
			"Threat",
			"Vulnerability",
			"Likelihood",
			"Impact",
			"Risk Value",
			"Risk Rating",
			"Current Control",
			"Control Rating",
			"Residual Risk",
			"Classification",
			"Mitigation Plan",
			"Risk Owner",
			"Timeline",
		];

		const data = processRisks.map((risk) => [
			risk.risk_id,
			risk.category,
			risk.risk_name,
			risk.identified_threat,
			risk.question,
			risk.likelihood,
			risk.impact,
			risk.risk_value,
			risk.residual_risk,
			risk.current_control_description,
			risk.current_control_rating,
			risk.residual_risk,
			risk.residual_risk?.charAt(0) || "M",
			risk.mitigation_plan,
			risk.risk_owner,
			risk.timeline,
		]);

		const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Process Risks");

		XLSX.writeFile(workbook, "ProcessRisks.xlsx");
	};

	return (
		<div className="min-h-screen p-6 bg-black text-gray-100">
			<div className="max-w-7xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-3xl font-bold text-cyan-400 mb-2 tracking-wide">
							Process Risk Assessment
						</h2>
						<p className="text-gray-300">
							Analyze process-related risks and control effectiveness
						</p>
						{enterpriseRisks.length > 0 && (
							<p className="text-cyan-300 text-sm mt-2">
								✓ {enterpriseRisks.length} enterprise risk(s) loaded
							</p>
						)}
					</div>
					<button
						onClick={() => window.history.back()}
						className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
					>
						← Back
					</button>
				</div>

				{/* Input Form */}
				<div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-cyan-400 mb-8">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-xl font-bold text-cyan-300">
							Risk Assessment Responses
						</h3>
						{processRisks.length === 0 && (
							<button
								onClick={exportToExcel}
								className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition"
							>
								Export to Excel
							</button>
						)}
					</div>

					{responses.map((response, index) => (
						<div
							key={index}
							className="bg-black p-4 rounded-lg border border-gray-700 mb-4"
						>
							<div className="flex justify-between items-center mb-3">
								<span className="text-cyan-400 font-semibold">
									Response {index + 1}
								</span>
								{responses.length > 1 && (
									<button
										onClick={() => removeResponse(index)}
										className="text-red-400 hover:text-red-300 text-sm"
									>
										Remove
									</button>
								)}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label className="block text-cyan-300 text-sm mb-2">
										Category
									</label>
									<input
										type="text"
										value={response.category}
										onChange={(e) =>
											handleResponseChange(index, "category", e.target.value)
										}
										className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
										placeholder="e.g., Data Security"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-cyan-300 text-sm mb-2">
										Question
									</label>
									<input
										type="text"
										value={response.question}
										onChange={(e) =>
											handleResponseChange(index, "question", e.target.value)
										}
										className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
										placeholder="e.g., Are backups tested regularly?"
									/>
								</div>
							</div>

							<div className="mt-3">
								<label className="block text-cyan-300 text-sm mb-2">
									User Answer
								</label>
								<textarea
									value={response.user_answer}
									onChange={(e) =>
										handleResponseChange(index, "user_answer", e.target.value)
									}
									className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
									rows="3"
									placeholder="Provide detailed answer..."
								/>
							</div>
						</div>
					))}

					<div className="flex gap-4 mt-4">
						<button
							onClick={addResponse}
							className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition"
						>
							+ Add Response
						</button>
						<button
							onClick={handleSubmit}
							disabled={loading}
							className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold px-6 py-2 rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
						>
							{loading ? "Analyzing..." : "Generate Process Risk Analysis"}
						</button>
					</div>
				</div>

				{/* Results Table */}
				{processRisks.length > 0 && (
					<>
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-2xl font-bold text-cyan-400">
								Process Risk Analysis Results
							</h3>
							<button
								onClick={exportToExcel}
								className="bg-cyan-400 text-black font-bold px-4 py-2 rounded-lg hover:scale-105 transition-transform"
							>
								Export to Excel
							</button>
						</div>

						<div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-cyan-400 mb-8">
							<div className="overflow-x-auto rounded-lg">
								<table className="min-w-full divide-y divide-gray-700">
									<thead className="bg-gray-950">
										<tr>
											{[
												"Risk ID",
												"Category",
												"Risk Name",
												"Threat",
												"Vulnerability",
												"Likelihood",
												"Impact",
												"Risk Value",
												"Risk Rating",
												"Current Control",
												"Control Rating",
												"Residual Risk",
												"Classification",
												"Mitigation Plan",
												"Risk Owner",
												"Timeline",
											].map((header) => (
												<th
													key={header}
													className="px-4 py-3 text-left text-cyan-400 uppercase tracking-wider text-xs whitespace-nowrap"
												>
													{header}
												</th>
											))}
										</tr>
									</thead>
									<tbody className="bg-black divide-y divide-gray-700">
										{processRisks.map((risk, index) => (
											<tr key={index} className="hover:bg-gray-800 transition-colors">
												<td className="px-4 py-3 text-sm font-mono">
													{risk.risk_id}
												</td>
												<td className="px-4 py-3 text-sm">{risk.category}</td>
												<td className="px-4 py-3 text-sm max-w-xs">
													{risk.risk_name}
												</td>
												<td className="px-4 py-3 text-sm max-w-xs">
													{risk.identified_threat}
												</td>
												<td className="px-4 py-3 text-sm max-w-xs">
													{risk.question}
												</td>
												<td className="px-4 py-3 text-sm text-center font-semibold">
													{risk.likelihood}
												</td>
												<td className="px-4 py-3 text-sm text-center font-semibold">
													{risk.impact}
												</td>
												<td className="px-4 py-3 text-sm text-center font-bold text-yellow-400">
													{risk.risk_value}
												</td>
												<td className="px-4 py-3 text-sm">
													<span
														className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskClassificationColor(
															risk.residual_risk
														)}`}
													>
														{risk.residual_risk}
													</span>
												</td>
												<td className="px-4 py-3 text-sm max-w-xs">
													{risk.current_control_description}
												</td>
												<td className="px-4 py-3 text-sm">
													{risk.current_control_rating}
												</td>
												<td className="px-4 py-3 text-sm">
													{risk.residual_risk}
												</td>
												<td className="px-4 py-3 text-sm">
													<span
														className={`px-2 py-1 rounded font-bold ${getRiskClassificationColor(
															risk.residual_risk
														)}`}
													>
														{risk.residual_risk?.charAt(0) || "M"}
													</span>
												</td>
												<td className="px-4 py-3 text-sm max-w-xs">
													{risk.mitigation_plan}
												</td>
												<td className="px-4 py-3 text-sm">{risk.risk_owner}</td>
												<td className="px-4 py-3 text-sm">{risk.timeline}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						{/* Summary Cards */}
						{processRisks.map(
							(risk, index) =>
								risk.summary && (
									<div
										key={index}
										className="bg-gray-900 p-6 rounded-xl shadow-lg border border-cyan-400 mb-6"
									>
										<h4 className="text-xl font-bold text-cyan-400 mb-4">
											Summary for {risk.risk_name}
										</h4>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="bg-gray-800 p-5 rounded-lg border border-cyan-500">
												<h5 className="text-cyan-300 font-bold mb-3">
													Risk Classification Summary
												</h5>
												<p className="text-gray-200 text-sm">
													{risk.summary.risk_classification_summary}
												</p>
											</div>

											<div className="bg-gray-800 p-5 rounded-lg border border-cyan-500">
												<h5 className="text-cyan-300 font-bold mb-3">
													Mitigation Suggestions
												</h5>
												<ul className="list-disc list-inside space-y-1">
													{risk.summary.mitigation_suggestions?.map(
														(suggestion, i) => (
															<li key={i} className="text-gray-200 text-sm">
																{suggestion}
															</li>
														)
													)}
												</ul>
											</div>

											{risk.summary.risk_trends && (
												<div className="md:col-span-2 bg-gray-800 p-5 rounded-lg border border-cyan-500">
													<h5 className="text-cyan-300 font-bold mb-3">
														Risk Trends
													</h5>
													<div className="grid grid-cols-2 gap-4 mb-3">
														<div>
															<span className="text-cyan-200 text-sm">
																Top Category:
															</span>
															<span className="text-white font-semibold ml-2">
																{risk.summary.risk_trends.top_category}
															</span>
														</div>
														<div>
															<span className="text-cyan-200 text-sm">
																Risk Severity:
															</span>
															<span className="text-white font-semibold ml-2">
																{risk.summary.risk_trends.risk_severity}
															</span>
														</div>
													</div>
													<div>
														<span className="text-cyan-200 text-sm block mb-2">
															Observations:
														</span>
														<ul className="list-disc list-inside space-y-1">
															{risk.summary.risk_trends.observations?.map(
																(obs, i) => (
																	<li key={i} className="text-gray-200 text-sm">
																		{obs}
																	</li>
																)
															)}
														</ul>
													</div>
												</div>
											)}
										</div>
									</div>
								)
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default ProcessRiskAssessment;