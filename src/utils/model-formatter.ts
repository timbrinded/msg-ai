import chalk from 'chalk';

export interface ModelGroup {
  family: string;
  models: string[];
}

/**
 * Groups models by their family/stub name
 */
export function groupModelsByFamily(models: string[]): ModelGroup[] {
  const groups = new Map<string, string[]>();
  
  for (const model of models) {
    const family = getModelFamily(model);
    if (!groups.has(family)) {
      groups.set(family, []);
    }
    groups.get(family)!.push(model);
  }
  
  // Sort families and models within each family
  const sortedGroups = Array.from(groups.entries())
    .sort((a, b) => {
      // Prioritize certain families
      const priority = ['gpt-5', 'gpt-4', 'o1', 'gpt-3', 'gemini-2', 'gemini-1', 'grok'];
      const aIndex = priority.findIndex(p => a[0].toLowerCase().includes(p));
      const bIndex = priority.findIndex(p => b[0].toLowerCase().includes(p));
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      return a[0].localeCompare(b[0]);
    })
    .map(([family, models]) => ({
      family,
      models: models.sort((a, b) => {
        // Sort by version/date in descending order
        const aDate = extractDate(a);
        const bDate = extractDate(b);
        if (aDate && bDate) {
          return bDate.localeCompare(aDate);
        }
        return b.localeCompare(a); // Reverse alphabetical (newer versions usually come later alphabetically)
      })
    }));
  
  return sortedGroups;
}

/**
 * Extracts the model family from a model name
 */
function getModelFamily(model: string): string {
  // OpenAI models
  if (model.startsWith('gpt-5')) return 'GPT-5';
  if (model.startsWith('gpt-4.1')) return 'GPT-4.1';
  if (model.startsWith('gpt-4o')) return 'GPT-4o';
  if (model.startsWith('gpt-4')) return 'GPT-4';
  if (model.startsWith('gpt-3')) return 'GPT-3.5';
  if (model.startsWith('o1-pro')) return 'O1 Pro';
  if (model.startsWith('o1')) return 'O1';
  if (model.startsWith('chatgpt')) return 'ChatGPT';
  
  // Gemini models
  if (model.startsWith('gemini-2.5')) return 'Gemini 2.5';
  if (model.startsWith('gemini-2.0')) return 'Gemini 2.0';
  if (model.startsWith('gemini-1.5')) return 'Gemini 1.5';
  if (model.startsWith('gemini-exp')) return 'Gemini Experimental';
  if (model.startsWith('gemini')) return 'Gemini';
  
  // Grok models
  if (model.startsWith('grok-3')) return 'Grok 3';
  if (model.startsWith('grok-2')) return 'Grok 2';
  if (model.startsWith('grok')) return 'Grok';
  
  // DeepSeek models
  if (model.startsWith('deepseek')) return 'DeepSeek';
  
  // Moonshot/Kimi models
  if (model.startsWith('moonshot')) return 'Moonshot';
  
  // Default to first part before dash
  const parts = model.split('-');
  const firstPart = parts[0] ?? model;
  return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
}

/**
 * Extracts date from model name if present
 */
function extractDate(model: string): string | null {
  // Match patterns like 2024-08-06, 2025-03-19, etc.
  const dateMatch = model.match(/\d{4}-\d{2}-\d{2}/);
  return dateMatch?.[0] ?? null;
}

/**
 * Formats models into a nice table for CLI display
 */
export function formatModelsTable(
  providerName: string,
  models: string[],
  showAll: boolean = false
): string {
  const groups = groupModelsByFamily(models);
  const lines: string[] = [];
  
  lines.push('');
  lines.push(chalk.bold.cyan(`┌─ ${providerName} Models ─────────────────────────────────┐`));
  lines.push(chalk.cyan('│                                                          │'));
  
  for (const group of groups) {
    // Family header
    lines.push(chalk.cyan('│ ') + chalk.bold.yellow(group.family.padEnd(56)) + chalk.cyan(' │'));
    lines.push(chalk.cyan('├──────────────────────────────────────────────────────────┤'));
    
    // Models in this family
    const modelsToShow = showAll ? group.models : group.models.slice(0, 3);
    const columns = 2;
    const columnWidth = 27;
    
    for (let i = 0; i < modelsToShow.length; i += columns) {
      let row = chalk.cyan('│ ');
      
      for (let j = 0; j < columns; j++) {
        const modelIndex = i + j;
        if (modelIndex < modelsToShow.length) {
          const model = modelsToShow[modelIndex];
          if (model) {
            const truncated = model.length > columnWidth 
              ? model.substring(0, columnWidth - 2) + '..'
              : model;
            row += chalk.white(truncated.padEnd(columnWidth));
          } else {
            row += ' '.repeat(columnWidth);
          }
        } else {
          row += ' '.repeat(columnWidth);
        }
        
        if (j < columns - 1) {
          row += chalk.cyan(' │ ');
        }
      }
      
      row += chalk.cyan(' │');
      lines.push(row);
    }
    
    // Show count if there are more models
    if (!showAll && group.models.length > 3) {
      const moreCount = group.models.length - 3;
      const moreText = chalk.gray.italic(`  ... and ${moreCount} more`);
      lines.push(chalk.cyan('│ ') + moreText.padEnd(56) + chalk.cyan(' │'));
    }
  }
  
  lines.push(chalk.cyan('└──────────────────────────────────────────────────────────┘'));
  
  // Summary
  lines.push('');
  lines.push(chalk.gray(`Total: ${models.length} models available`));
  
  return lines.join('\n');
}

/**
 * Formats a simple model list with grouping
 */
export function formatModelsList(models: string[]): string {
  const groups = groupModelsByFamily(models);
  const lines: string[] = [];
  
  for (const group of groups) {
    lines.push('');
    lines.push(chalk.bold.yellow(`${group.family}:`));
    
    for (const model of group.models) {
      lines.push(chalk.cyan(`  • ${model}`));
    }
  }
  
  return lines.join('\n');
}