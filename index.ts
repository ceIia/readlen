#!/usr/bin/env bun

import chalk from "chalk";
import { Command } from "commander";

interface FileStats {
  path: string;
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  readTime: number;
}

// process text content and return stats
const processText = (text: string): Omit<FileStats, "path"> => {
  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = normalizedText.length;
  const paragraphCount = normalizedText.split(/\n\s*\n/).filter(Boolean).length;

  // Based on Brysbaert, M. (2019). How many words do we read per minute? A review and meta-analysis of reading rate.
  // https://psycnet.apa.org/record/2019-59523-001
  const SILENT_READING_WPM = 238; // median silent reading rate for native English speakers
  const readTime = Math.ceil(wordCount / SILENT_READING_WPM);

  return { wordCount, charCount, paragraphCount, readTime };
};

// process a single file
const processFile = async (path: string): Promise<FileStats> => {
  const file = Bun.file(path);
  const exists = await file.exists();

  if (!exists) {
    throw new Error(`file not found: ${path}`);
  }

  const content = await file.text();
  return {
    path,
    ...processText(content),
  };
};

const formatReadTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);
  const seconds = Math.round((minutes % 1) * 60);

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }
  if (remainingMinutes > 0) {
    parts.push(
      `${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`
    );
  }
  if (seconds > 0 && hours === 0) {
    // Only show seconds if less than an hour
    parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
  }

  return parts.length > 0 ? parts.join(", ") : "< 1 second";
};

const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US", { useGrouping: true });
};

const program = new Command();

program
  .name("readlen")
  .description("calculate reading statistics for text files")
  .version(Bun.version)
  .argument("<files...>", "files or directories to analyze")
  .option("-r, --recursive", "process directories recursively", false)
  .action(async (files: string[], options: { recursive: boolean }) => {
    const results: FileStats[] = [];

    for (const path of files) {
      try {
        if (await Bun.file(path).exists()) {
          // handle single file directly
          try {
            const stats = await processFile(path);
            results.push(stats);
          } catch (err) {
            console.error(chalk.red(`error processing ${path}:`, err));
          }
        } else {
          // treat as directory pattern
          const glob = new Bun.Glob(
            options.recursive
              ? "**/*.{txt,md,html,json}"
              : "*.{txt,md,html,json}"
          );

          for await (const file of glob.scan({
            cwd: path,
            absolute: true,
            onlyFiles: true,
          })) {
            try {
              const stats = await processFile(file);
              results.push(stats);
            } catch (err) {
              console.error(chalk.red(`error processing ${file}:`, err));
            }
          }
        }
      } catch (err) {
        console.error(chalk.red(`error processing ${path}:`, err));
      }
    }

    if (results.length === 0) {
      console.log(chalk.yellow("no valid text files found."));
      process.exit(0);
    }

    // individual file stats
    for (const {
      path,
      wordCount,
      charCount,
      paragraphCount,
      readTime,
    } of results) {
      if (results.length > 1) console.log(); // Add line break between files
      console.log(chalk.cyan(`- ${path}`));
      console.log(
        chalk.whiteBright(`  words: ${chalk.white(formatNumber(wordCount))}`)
      );
      console.log(
        chalk.whiteBright(
          `  characters: ${chalk.white(formatNumber(charCount))}`
        )
      );
      console.log(
        chalk.whiteBright(
          `  paragraphs: ${chalk.white(formatNumber(paragraphCount))}`
        )
      );
      console.log(
        chalk.whiteBright(
          `  read time: ${chalk.white(formatReadTime(readTime))}`
        )
      );
    }

    // Only show totals if there are multiple files
    if (results.length > 1) {
      const totalWords = results.reduce((sum, r) => sum + r.wordCount, 0);
      const totalChars = results.reduce((sum, r) => sum + r.charCount, 0);
      const totalParas = results.reduce((sum, r) => sum + r.paragraphCount, 0);
      const totalTime = results.reduce((sum, r) => sum + r.readTime, 0);

      console.log(chalk.cyan("\ntotals:"));
      console.log(
        chalk.whiteBright(
          `  files: ${chalk.white(formatNumber(results.length))}`
        )
      );
      console.log(
        chalk.whiteBright(`  words: ${chalk.white(formatNumber(totalWords))}`)
      );
      console.log(
        chalk.whiteBright(
          `  characters: ${chalk.white(formatNumber(totalChars))}`
        )
      );
      console.log(
        chalk.whiteBright(
          `  paragraphs: ${chalk.white(formatNumber(totalParas))}`
        )
      );
      console.log(
        chalk.whiteBright(
          `  total read time: ${chalk.white(formatReadTime(totalTime))}`
        )
      );
    }
  });

program.parse();
