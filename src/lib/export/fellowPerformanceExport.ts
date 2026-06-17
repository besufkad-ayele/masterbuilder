import ExcelJS from "exceljs";
import type { ExamAttempt } from "@/services/ExamService";
import type {
    BehavioralIndicator,
    Competency,
    FellowProfile,
    GroundingResult,
    PhaseProgress,
    Portfolio,
} from "@/types";
import { createBarChartImage, createDoughnutChartImage } from "./chartImage";

export type FellowExportRow = {
    "Fellow ID": string;
    "Full Name": string;
    "Grounding (10%)": number;
    Believe: "Pass" | "Failed";
    "Know (20%)": number;
    "Do (50%)": number;
    "Final Assesment (20%)": number;
    "Total (100%)": number;
};

export type FellowReportData = {
    fellow: FellowProfile;
    progress: PhaseProgress[];
    portfolios: Portfolio[];
    groundingResults: GroundingResult[];
    examAttempts: ExamAttempt[];
};

export type CompetencyExportReport = {
    competency: Competency;
    rows: FellowExportRow[];
};

const EXPORT_COLUMNS: (keyof FellowExportRow)[] = [
    "Fellow ID",
    "Full Name",
    "Grounding (10%)",
    "Believe",
    "Know (20%)",
    "Do (50%)",
    "Final Assesment (20%)",
    "Total (100%)",
];

const SCORE_BUCKETS = [
    { label: "0-49 Developing", min: 0, max: 49 },
    { label: "50-74 Progressing", min: 50, max: 74 },
    { label: "75-100 Excellence", min: 75, max: 100 },
] as const;

const BRAND_GREEN = "FF1B4332";
const BRAND_GOLD = "FFC5A059";
const MUTED_BG = "FFF5F3EB";
const NOTE_GRAY = "FF666666";

type DashboardChart =
    | {
          kind: "bar";
          title: string;
          labels: string[];
          values: number[];
          maxValue?: number;
          horizontal?: boolean;
      }
    | {
          kind: "doughnut";
          title: string;
          labels: string[];
          values: number[];
      };

type DashboardSection = {
    title: string;
    note: string;
    headers: string[];
    rows: (string | number)[][];
    chart?: DashboardChart;
};

function average(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildFellowAverageTotals(
    reports: CompetencyExportReport[]
): Map<string, { name: string; avgTotal: number }> {
    const totals = new Map<string, { name: string; scores: number[] }>();

    reports.forEach((report) => {
        report.rows.forEach((row) => {
            const existing = totals.get(row["Fellow ID"]) || {
                name: row["Full Name"],
                scores: [],
            };
            existing.scores.push(row["Total (100%)"]);
            totals.set(row["Fellow ID"], existing);
        });
    });

    return new Map(
        Array.from(totals.entries()).map(([fellowId, value]) => [
            fellowId,
            { name: value.name, avgTotal: average(value.scores) },
        ])
    );
}

function buildDashboardSections({
    fellowCount,
    reports,
}: {
    fellowCount: number;
    reports: CompetencyExportReport[];
}): DashboardSection[] {
    const allRows = reports.flatMap((report) => report.rows);
    const believePassCount = allRows.filter((row) => row.Believe === "Pass").length;
    const believePassRate =
        allRows.length > 0 ? Math.round((believePassCount / allRows.length) * 100) : 0;
    const avgTotal = average(allRows.map((row) => row["Total (100%)"]));

    const componentAverages = {
        grounding: average(allRows.map((row) => row["Grounding (10%)"])),
        know: average(allRows.map((row) => row["Know (20%)"])),
        do: average(allRows.map((row) => row["Do (50%)"])),
        final: average(allRows.map((row) => row["Final Assesment (20%)"])),
    };

    const fellowAverages = Array.from(buildFellowAverageTotals(reports).values());
    const fellowCountForDistribution = fellowAverages.length || 1;

    const distribution = SCORE_BUCKETS.map((bucket) => {
        const count = fellowAverages.filter(
            (entry) => entry.avgTotal >= bucket.min && entry.avgTotal <= bucket.max
        ).length;
        return {
            label: bucket.label,
            count,
            share: Math.round((count / fellowCountForDistribution) * 100),
        };
    });

    const topFellows = Array.from(buildFellowAverageTotals(reports).entries())
        .map(([fellowId, value]) => ({
            fellowId,
            name: value.name,
            avgTotal: value.avgTotal,
        }))
        .sort((a, b) => b.avgTotal - a.avgTotal)
        .slice(0, 10);

    return [
        {
            title: "Program Snapshot",
            note: "Overview of cohort size and headline performance indicators across all fellow-competency records.",
            headers: ["Metric", "Value"],
            rows: [
                ["Total Fellows", fellowCount],
                ["Competencies Reported", reports.length],
                ["Fellow-Competency Records", allRows.length],
                ["Average Total Score", avgTotal],
                ["Believe Pass Rate", `${believePassRate}%`],
            ],
            chart: {
                kind: "bar",
                title: "Program Snapshot",
                labels: ["Avg Total Score", "Believe Pass Rate"],
                values: [avgTotal, believePassRate],
                maxValue: 100,
            },
        },
        {
            title: "Score Component Averages",
            note: "Bar chart of average weighted contributions. Grounding is out of 10, Know out of 20, Do out of 50, and Final Assessment out of 20.",
            headers: ["Component", "Average", "Maximum"],
            rows: [
                ["Grounding (10%)", componentAverages.grounding, 10],
                ["Know (20%)", componentAverages.know, 20],
                ["Do (50%)", componentAverages.do, 50],
                ["Final Assesment (20%)", componentAverages.final, 20],
            ],
            chart: {
                kind: "bar",
                title: "Average Score by Component",
                labels: ["Grounding", "Know", "Do", "Final Assessment"],
                values: [
                    componentAverages.grounding,
                    componentAverages.know,
                    componentAverages.do,
                    componentAverages.final,
                ],
                maxValue: 50,
            },
        },
        {
            title: "Competency Performance Overview",
            note: "Compares average total score for each competency across all fellows in the cohort.",
            headers: ["Competency", "Avg Total", "Believe Pass %"],
            rows: reports.map((report) => {
                const competencyRows = report.rows;
                const competencyBelievePassRate =
                    competencyRows.length > 0
                        ? Math.round(
                              (competencyRows.filter((row) => row.Believe === "Pass").length /
                                  competencyRows.length) *
                                  100
                          )
                        : 0;

                return [
                    report.competency.title,
                    average(competencyRows.map((row) => row["Total (100%)"])),
                    `${competencyBelievePassRate}%`,
                ];
            }),
            chart: {
                kind: "bar",
                title: "Average Total Score by Competency",
                labels: reports.map((report) =>
                    report.competency.title.length > 28
                        ? `${report.competency.title.slice(0, 28)}...`
                        : report.competency.title
                ),
                values: reports.map((report) =>
                    average(report.rows.map((row) => row["Total (100%)"]))
                ),
                maxValue: 100,
            },
        },
        {
            title: "Total Score Distribution",
            note: "Shows how fellows are distributed by their average total score across competencies. Developing is below 50, Progressing is 50-74, and Excellence is 75+.",
            headers: ["Score Range", "Fellow Count", "Share"],
            rows: distribution.map((bucket) => [
                bucket.label,
                bucket.count,
                `${bucket.share}%`,
            ]),
            chart: {
                kind: "bar",
                title: "Fellow Distribution by Score Band",
                labels: distribution.map((bucket) => bucket.label),
                values: distribution.map((bucket) => bucket.count),
            },
        },
        {
            title: "Top Fellows by Average Total Score",
            note: "Horizontal bar chart ranking the top 10 fellows based on their average total score across all competency sheets.",
            headers: ["Rank", "Fellow ID", "Full Name", "Average Total"],
            rows: topFellows.map((entry, index) => [
                index + 1,
                entry.fellowId,
                entry.name,
                entry.avgTotal,
            ]),
            chart: {
                kind: "bar",
                title: "Top 10 Fellows",
                labels: topFellows.map((entry) =>
                    entry.name.length > 24 ? `${entry.name.slice(0, 24)}...` : entry.name
                ),
                values: topFellows.map((entry) => entry.avgTotal),
                maxValue: 100,
                horizontal: true,
            },
        },
        {
            title: "Believe Gatekeeper Summary",
            note: "Doughnut chart showing how many fellow-competency records passed or failed the Believe gatekeeper requirement.",
            headers: ["Status", "Records", "Share"],
            rows: [
                ["Pass", believePassCount, `${believePassRate}%`],
                ["Failed", allRows.length - believePassCount, `${100 - believePassRate}%`],
            ],
            chart: {
                kind: "doughnut",
                title: "Believe Pass vs Failed",
                labels: ["Pass", "Failed"],
                values: [believePassCount, allRows.length - believePassCount],
            },
        },
    ];
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, columnCount: number) {
    for (let column = 1; column <= columnCount; column += 1) {
        const cell = sheet.getCell(rowNumber, column);
        cell.font = { bold: true, color: { argb: BRAND_GREEN } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: MUTED_BG },
        };
        cell.border = {
            bottom: { style: "thin", color: { argb: BRAND_GOLD } },
        };
    }
}

async function addChartToSheet(
    workbook: ExcelJS.Workbook,
    sheet: ExcelJS.Worksheet,
    chart: DashboardChart,
    row: number
) {
    const imageDataUrl =
        chart.kind === "doughnut"
            ? await createDoughnutChartImage({
                  title: chart.title,
                  labels: chart.labels,
                  values: chart.values,
              })
            : await createBarChartImage({
                  title: chart.title,
                  labels: chart.labels,
                  values: chart.values,
                  maxValue: chart.maxValue,
                  horizontal: chart.horizontal,
              });

    const imageId = workbook.addImage({
        base64: imageDataUrl.replace(/^data:image\/png;base64,/, ""),
        extension: "png",
    });

    sheet.addImage(imageId, {
        tl: { col: 0, row: row - 1 },
        ext: {
            width: 720,
            height: chart.kind === "bar" && chart.horizontal ? 460 : 400,
        },
    });

    return chart.kind === "bar" && chart.horizontal ? 24 : 22;
}

async function buildDashboardSheet(
    workbook: ExcelJS.Workbook,
    exportDate: string,
    sections: DashboardSection[]
) {
    const sheet = workbook.addWorksheet("Dashboard", {
        views: [{ showGridLines: false }],
    });

    sheet.columns = [
        { width: 34 },
        { width: 18 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
    ];

    let currentRow = 1;

    sheet.mergeCells(currentRow, 1, currentRow, 6);
    const titleCell = sheet.getCell(currentRow, 1);
    titleCell.value = "Fellowship Performance Dashboard";
    titleCell.font = { bold: true, size: 18, color: { argb: BRAND_GREEN } };
    titleCell.alignment = { vertical: "middle" };
    currentRow += 1;

    sheet.mergeCells(currentRow, 1, currentRow, 6);
    const dateCell = sheet.getCell(currentRow, 1);
    dateCell.value = `Generated on ${exportDate}`;
    dateCell.font = { italic: true, color: { argb: NOTE_GRAY } };
    currentRow += 2;

    for (const section of sections) {
        sheet.mergeCells(currentRow, 1, currentRow, 6);
        const sectionCell = sheet.getCell(currentRow, 1);
        sectionCell.value = section.title;
        sectionCell.font = { bold: true, size: 14, color: { argb: BRAND_GREEN } };
        sectionCell.note = section.note;
        currentRow += 1;

        sheet.mergeCells(currentRow, 1, currentRow, 6);
        const noteCell = sheet.getCell(currentRow, 1);
        noteCell.value = `Note: ${section.note}`;
        noteCell.font = { italic: true, size: 10, color: { argb: NOTE_GRAY } };
        noteCell.alignment = { wrapText: true };
        sheet.getRow(currentRow).height = 42;
        currentRow += 1;

        section.headers.forEach((header, index) => {
            sheet.getCell(currentRow, index + 1).value = header;
        });
        styleHeaderRow(sheet, currentRow, section.headers.length);
        currentRow += 1;

        section.rows.forEach((row) => {
            row.forEach((value, index) => {
                sheet.getCell(currentRow, index + 1).value = value;
            });
            currentRow += 1;
        });

        if (section.chart) {
            currentRow += 1;
            const chartRowSpan = await addChartToSheet(
                workbook,
                sheet,
                section.chart,
                currentRow
            );
            currentRow += chartRowSpan;
        }

        currentRow += 2;
    }
}

export function buildFellowExportRow({
    fellow,
    competencyBiIds,
    progress,
    portfolios,
    groundingResults,
    finalAssessmentScore,
}: {
    fellow: FellowProfile;
    competencyBiIds: string[];
    progress: PhaseProgress[];
    portfolios: Portfolio[];
    groundingResults: GroundingResult[];
    finalAssessmentScore: number;
}): FellowExportRow {
    const biMetrics = competencyBiIds.map((biId) => {
        const biProgress = progress.filter((p) => p.behavioral_indicator_id === biId);
        const believePhase = biProgress.find((p) => p.phase_type === "believe");
        const knowPhase = biProgress.find((p) => p.phase_type === "know");
        const approvedPortfolio = portfolios.find(
            (p) => p.behavioral_indicator_id === biId && p.status === "approved"
        );

        return {
            believePassed: !!believePhase?.believe_passed,
            knowContribution: Math.round(((knowPhase?.know_score || 0) / 100) * 20),
            doContribution: Math.round(approvedPortfolio?.score || 0),
        };
    });

    const groundingScore = Math.round(groundingResults[0]?.score || 0);
    const knowScore =
        biMetrics.length > 0
            ? average(biMetrics.map((metric) => metric.knowContribution))
            : 0;
    const doScore =
        biMetrics.length > 0
            ? average(biMetrics.map((metric) => metric.doContribution))
            : 0;
    const believeStatus =
        biMetrics.length > 0 && biMetrics.every((metric) => metric.believePassed)
            ? "Pass"
            : "Failed";
    const finalAssessment = Math.round(finalAssessmentScore);
    const total = Math.round(groundingScore + knowScore + doScore + finalAssessment);

    return {
        "Fellow ID": fellow.fellow_id || "",
        "Full Name": fellow.full_name || "",
        "Grounding (10%)": groundingScore,
        Believe: believeStatus,
        "Know (20%)": knowScore,
        "Do (50%)": doScore,
        "Final Assesment (20%)": finalAssessment,
        "Total (100%)": total,
    };
}

export function buildCompetencyExportReports({
    competencies,
    behavioralIndicators,
    fellowReports,
}: {
    competencies: Competency[];
    behavioralIndicators: BehavioralIndicator[];
    fellowReports: FellowReportData[];
}): CompetencyExportReport[] {
    const competencyBIMap = new Map<string, string[]>();

    competencies.forEach((competency) => {
        const biIds = behavioralIndicators
            .filter((bi) => bi.competency_id === competency.id)
            .map((bi) => bi.id);
        if (biIds.length > 0) {
            competencyBIMap.set(competency.id, biIds);
        }
    });

    return competencies
        .map((competency) => {
            const competencyBiIds = competencyBIMap.get(competency.id);
            if (!competencyBiIds || competencyBiIds.length === 0) return null;

            const rows = fellowReports.map(
                ({ fellow, progress, portfolios, groundingResults, examAttempts }) => {
                    const competencyExamScores = examAttempts
                        .filter((attempt) => attempt.exam_id === competency.id)
                        .map((attempt) => attempt.score || 0);
                    const finalAssessmentScore =
                        competencyExamScores.length > 0
                            ? competencyExamScores.reduce((sum, score) => sum + score / 5, 0) /
                              competencyExamScores.length
                            : 0;

                    return buildFellowExportRow({
                        fellow,
                        competencyBiIds,
                        progress,
                        portfolios,
                        groundingResults,
                        finalAssessmentScore,
                    });
                }
            );

            return { competency, rows };
        })
        .filter((report): report is CompetencyExportReport => report !== null);
}

export function sanitizeSheetName(name: string): string {
    return name.replace(/[\[\]\*\/\\\?:]/g, "").slice(0, 31) || "Competency";
}

function addCompetencySheet(workbook: ExcelJS.Workbook, report: CompetencyExportReport) {
    const sheet = workbook.addWorksheet(sanitizeSheetName(report.competency.title));

    sheet.columns = EXPORT_COLUMNS.map((column) => ({
        header: column,
        key: column,
        width: Math.max(column.length + 4, 16),
    }));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: BRAND_GREEN } };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: MUTED_BG },
    };

    report.rows.forEach((row) => {
        sheet.addRow(row);
    });
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

export async function exportFellowsPerformanceWorkbook({
    fellowReports,
    competencies,
    behavioralIndicators,
    fileName,
}: {
    fellowReports: FellowReportData[];
    competencies: Competency[];
    behavioralIndicators: BehavioralIndicator[];
    fileName: string;
}): Promise<void> {
    const reports = buildCompetencyExportReports({
        competencies,
        behavioralIndicators,
        fellowReports,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Masterbuilder Admin";
    workbook.created = new Date();

    const sections = buildDashboardSections({
        fellowCount: fellowReports.length,
        reports,
    });

    await buildDashboardSheet(workbook, new Date().toLocaleString(), sections);

    reports.forEach((report) => {
        addCompetencySheet(workbook, report);
    });

    if (reports.length === 0) {
        workbook.addWorksheet("Report");
    }

    await downloadWorkbook(workbook, fileName);
}
