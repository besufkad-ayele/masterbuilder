import type ExcelJS from "exceljs";
import type { ExamAttempt } from "@/services/ExamService";
import {
    buildCompetencyPerformance,
    resolveCompetencyBiIds,
} from "@/services/FellowProgressService";
import type {
    BehavioralIndicator,
    Competency,
    FellowProfile,
    GroundingResult,
    PhaseProgress,
    Portfolio,
    Wave,
    WaveCompetency,
} from "@/types";
import { createBarChartImage, createDoughnutChartImage } from "./chartImage";

export type FellowExportRow = {
    "Fellow ID": string;
    "Full Name": string;
    "Grounding (10%)": number;
    Believe: "Pass" | "Failed";
    "Know (20%)": number;
    "Do (50%)": number;
    "Final Assessment (20%)": number;
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

export type WaveDashboardBundle = {
    wave: Wave;
    fellowCount: number;
    reports: CompetencyExportReport[];
};

const EXPORT_COLUMNS: (keyof FellowExportRow)[] = [
    "Fellow ID",
    "Full Name",
    "Grounding (10%)",
    "Believe",
    "Know (20%)",
    "Do (50%)",
    "Final Assessment (20%)",
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

type ExcelJSModule = {
    Workbook: new () => ExcelJS.Workbook;
};

function average(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

async function loadExcelJS(): Promise<ExcelJSModule> {
    const mod = await import("exceljs");
    const resolved = (mod as { default?: ExcelJSModule } & ExcelJSModule).default ?? mod;
    if (!resolved?.Workbook) {
        throw new Error("ExcelJS failed to load in this browser.");
    }
    return resolved;
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
    scopeLabel = "program",
}: {
    fellowCount: number;
    reports: CompetencyExportReport[];
    scopeLabel?: string;
}): DashboardSection[] {
    const allRows = reports.flatMap((report) => report.rows);
    const believePassCount = allRows.filter((row) => row.Believe === "Pass").length;
    const believePassRate =
        allRows.length > 0 ? Math.round((believePassCount / allRows.length) * 100) : 0;
    const avgTotal = average(allRows.map((row) => row["Total (100%)"]));
    const snapshotTitle =
        scopeLabel === "program" ? "Program Snapshot" : "Wave Snapshot";

    const componentAverages = {
        grounding: average(allRows.map((row) => row["Grounding (10%)"])),
        know: average(allRows.map((row) => row["Know (20%)"])),
        do: average(allRows.map((row) => row["Do (50%)"])),
        final: average(allRows.map((row) => row["Final Assessment (20%)"])),
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
            title: snapshotTitle,
            note: `Overview of ${scopeLabel} size and headline performance indicators across fellow-competency records in this scope.`,
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
                title: snapshotTitle,
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
                ["Final Assessment (20%)", componentAverages.final, 20],
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
            note: `Compares average total score for each competency across fellows in this ${scopeLabel}.`,
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
            note: `Horizontal bar chart ranking the top 10 fellows based on their average total score across competencies in this ${scopeLabel}.`,
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

function formatWaveLabel(wave: Wave): string {
    const number = wave.number ?? 0;
    const name = wave.name?.trim();
    if (name) {
        return name.toLowerCase().startsWith("wave")
            ? name
            : `Wave ${number}: ${name}`;
    }
    return `Wave ${number}`;
}

export function buildWaveDashboardBundles({
    waves,
    waveCompetencies,
    fellowReports,
    competencies,
    behavioralIndicators,
}: {
    waves: Wave[];
    waveCompetencies: WaveCompetency[];
    fellowReports: FellowReportData[];
    competencies: Competency[];
    behavioralIndicators: BehavioralIndicator[];
}): WaveDashboardBundle[] {
    const competencyById = new Map(competencies.map((competency) => [competency.id, competency]));

    return [...waves]
        .sort((a, b) => {
            if (a.cohort_id !== b.cohort_id) {
                return a.cohort_id.localeCompare(b.cohort_id);
            }
            return (a.number ?? 0) - (b.number ?? 0);
        })
        .map((wave) => {
            const waveCompetencyIds = new Set(
                waveCompetencies
                    .filter((link) => link.wave_id === wave.id)
                    .map((link) => link.competency_id)
            );
            const waveCompetencyList = Array.from(waveCompetencyIds)
                .map((id) => competencyById.get(id))
                .filter((competency): competency is Competency => !!competency);

            const waveFellowReports = fellowReports.filter(
                (report) => report.fellow.cohort_id === wave.cohort_id
            );

            const reports = buildCompetencyExportReports({
                competencies: waveCompetencyList,
                behavioralIndicators,
                fellowReports: waveFellowReports,
            });

            return {
                wave,
                fellowCount: waveFellowReports.length,
                reports,
            };
        })
        .filter((bundle) => bundle.reports.length > 0);
}

async function buildDashboardSheet(
    workbook: ExcelJS.Workbook,
    exportDate: string,
    sections: DashboardSection[],
    {
        sheetName,
        title,
        usedNames,
    }: {
        sheetName: string;
        title: string;
        usedNames: Set<string>;
    }
) {
    const sheet = workbook.addWorksheet(uniqueSheetName(sheetName, usedNames), {
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
    titleCell.value = title;
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
            try {
                const chartRowSpan = await addChartToSheet(
                    workbook,
                    sheet,
                    section.chart,
                    currentRow
                );
                currentRow += chartRowSpan;
            } catch (error) {
                console.warn("Skipping dashboard chart:", section.chart.title, error);
                sheet.getCell(currentRow, 1).value = "(Chart could not be generated)";
                sheet.getCell(currentRow, 1).font = {
                    italic: true,
                    color: { argb: NOTE_GRAY },
                };
                currentRow += 2;
            }
        }

        currentRow += 2;
    }
}

export function buildFellowExportRow({
    fellow,
    competency,
    progress,
    portfolios,
    groundingResults,
    examAttempts,
    behavioralIndicators,
}: {
    fellow: FellowProfile;
    competency: Competency;
    progress: PhaseProgress[];
    portfolios: Portfolio[];
    groundingResults: GroundingResult[];
    examAttempts: ExamAttempt[];
    behavioralIndicators: BehavioralIndicator[];
}): FellowExportRow {
    const groundingScore = Math.round(groundingResults[0]?.score || 0);
    const performance = buildCompetencyPerformance(competency, {
        progress,
        portfolios,
        behavioralIndicators,
        examAttempts,
        groundingScoreOutOf10: groundingScore,
    });

    const knowScore =
        performance.biBreakdown.length > 0
            ? average(performance.biBreakdown.map((metric) => metric.knowContribution))
            : 0;
    const doScore =
        performance.biBreakdown.length > 0
            ? average(performance.biBreakdown.map((metric) => metric.doContribution))
            : 0;
    const believeStatus =
        performance.biBreakdown.length > 0 &&
        performance.biBreakdown.every((metric) => metric.believePassed)
            ? "Pass"
            : "Failed";

    return {
        "Fellow ID": fellow.fellow_id || "",
        "Full Name": fellow.full_name || "",
        "Grounding (10%)": performance.groundingContribution,
        Believe: believeStatus,
        "Know (20%)": knowScore,
        "Do (50%)": doScore,
        "Final Assessment (20%)": performance.examContribution,
        "Total (100%)": performance.compositeScore,
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
    return competencies
        .map((competency) => {
            const hasIndicators =
                resolveCompetencyBiIds(competency.id, [], behavioralIndicators).length >
                    0 ||
                fellowReports.some(
                    (report) =>
                        resolveCompetencyBiIds(
                            competency.id,
                            report.progress,
                            behavioralIndicators
                        ).length > 0
                );

            if (!hasIndicators) return null;

            const rows = fellowReports.map(
                ({ fellow, progress, portfolios, groundingResults, examAttempts }) =>
                    buildFellowExportRow({
                        fellow,
                        competency,
                        progress,
                        portfolios,
                        groundingResults,
                        examAttempts,
                        behavioralIndicators,
                    })
            );

            return { competency, rows };
        })
        .filter((report): report is CompetencyExportReport => report !== null);
}

export function sanitizeSheetName(name: string): string {
    return name.replace(/[\[\]\*\/\\\?:]/g, "").slice(0, 31) || "Competency";
}

export function uniqueSheetName(name: string, usedNames: Set<string>): string {
    const base = sanitizeSheetName(name);
    if (!usedNames.has(base.toLowerCase())) {
        usedNames.add(base.toLowerCase());
        return base;
    }

    let index = 2;
    while (index < 1000) {
        const suffix = ` (${index})`;
        const truncated = `${base.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`;
        if (!usedNames.has(truncated.toLowerCase())) {
            usedNames.add(truncated.toLowerCase());
            return truncated;
        }
        index += 1;
    }

    const fallback = `Sheet ${usedNames.size + 1}`.slice(0, 31);
    usedNames.add(fallback.toLowerCase());
    return fallback;
}

function addCompetencySheet(
    workbook: ExcelJS.Workbook,
    report: CompetencyExportReport,
    usedNames: Set<string>
) {
    const sheet = workbook.addWorksheet(uniqueSheetName(report.competency.title, usedNames));

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
    const bytes =
        buffer instanceof ArrayBuffer
            ? new Uint8Array(buffer)
            : new Uint8Array(buffer as ArrayLike<number>);

    const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export async function exportFellowsPerformanceWorkbook({
    fellowReports,
    competencies,
    behavioralIndicators,
    fileName,
    waves = [],
    waveCompetencies = [],
}: {
    fellowReports: FellowReportData[];
    competencies: Competency[];
    behavioralIndicators: BehavioralIndicator[];
    fileName: string;
    waves?: Wave[];
    waveCompetencies?: WaveCompetency[];
}): Promise<void> {
    if (typeof window === "undefined" || typeof document === "undefined") {
        throw new Error("Excel export is only available in the browser.");
    }

    const reports = buildCompetencyExportReports({
        competencies,
        behavioralIndicators,
        fellowReports,
    });

    const waveBundles = buildWaveDashboardBundles({
        waves,
        waveCompetencies,
        fellowReports,
        competencies,
        behavioralIndicators,
    });

    const { Workbook } = await loadExcelJS();
    const workbook = new Workbook();
    workbook.creator = "Masterbuilder Admin";
    workbook.created = new Date();

    const usedNames = new Set<string>();
    const exportDate = new Date().toLocaleString();

    await buildDashboardSheet(
        workbook,
        exportDate,
        buildDashboardSections({
            fellowCount: fellowReports.length,
            reports,
            scopeLabel: "program",
        }),
        {
            sheetName: "Dashboard",
            title: "Fellowship Performance Dashboard",
            usedNames,
        }
    );

    for (const bundle of waveBundles) {
        const waveLabel = formatWaveLabel(bundle.wave);
        await buildDashboardSheet(
            workbook,
            exportDate,
            buildDashboardSections({
                fellowCount: bundle.fellowCount,
                reports: bundle.reports,
                scopeLabel: "wave",
            }),
            {
                sheetName: `${waveLabel} Dashboard`,
                title: `${waveLabel} — Performance Dashboard`,
                usedNames,
            }
        );
    }

    reports.forEach((report) => {
        addCompetencySheet(workbook, report, usedNames);
    });

    if (reports.length === 0 && waveBundles.length === 0) {
        workbook.addWorksheet(uniqueSheetName("Report", usedNames));
    }

    await downloadWorkbook(workbook, fileName);
}
