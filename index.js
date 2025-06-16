import { Command } from "commander";
const program = new Command();
import fs from "fs";
import path from "path";

const DATA_FILE = path.resolve("expenses.json");

let nextId = 1;

let expenses = [];

if (fs.existsSync(DATA_FILE)) {
  const rawData = fs.readFileSync(DATA_FILE, "utf-8");
  try {
    expenses = JSON.parse(rawData); // Parse the existing expenses
    if (expenses.length > 0) {
      nextId = Math.max(...expenses.map((expense) => expense.id)) + 1;
    }
  } catch (error) {
    console.error("Error reading expenses file:", error);
    expenses = [];
  }
}

program
  .name("my-cli")
  .description("A CLI tool to manage finances, add, delete and view expenses")
  .version("1.0.0");

program
  .command("add")
  .description("Add a new expense")
  .requiredOption("--description <string>", "Description of the expense")
  .requiredOption("--amount <number>", "Amount of the expense")
  .action((options) => {
    const today = new Date();
    const date = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const expense = {
      id: nextId++,
      date,
      description: options.description,
      amount: parseFloat(options.amount),
    };
    expenses.push(expense);
    fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2)); // persistir

    console.log("✅ Gasto agregado:");
    console.log(expense);
  });

//Command to view all expenses
program
  .command("list")
  .description("View all expenses")
  .action(() => {
    if (!fs.existsSync(DATA_FILE)) {
      return console.log("No hay gastos registrados.");
    }

    try {
      const rawData = fs.readFileSync(DATA_FILE, "utf-8");
      const data = JSON.parse(rawData);

      if (!Array.isArray(data) || data.length === 0) {
        console.log("No hay gastos registrados.");
      } else {
        console.log("📋 Lista de gastos:");
        console.table(data);
      }
    } catch (error) {
      console.error("❌ Error al leer el archivo de gastos:", error.message);
    }
  });

program
  .command("delete <id>")
  .description("Delete an expense by ID")
  .action((id) => {
    const expenseId = parseInt(id, 10);
    const index = expenses.findIndex((expense) => expense.id === expenseId);

    if (index === -1) {
      console.log(`❌ No se encontró el gasto con ID ${expenseId}.`);
      return;
    }

    const deletedExpense = expenses.splice(index, 1)[0];
    fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2)); // persistir

    console.log(`✅ Gasto eliminado:`, deletedExpense);
  });

program
  .command("summary [month]")
  .description("View total expenses or filter by month (1-12)")
  .action((month) => {
    if (!fs.existsSync(DATA_FILE)) {
      return console.log("No hay gastos registrados.");
    }

    try {
      const rawData = fs.readFileSync(DATA_FILE, "utf-8");
      const data = JSON.parse(rawData);

      if (!Array.isArray(data) || data.length === 0) {
        console.log("No hay gastos registrados.");
        return;
      }

      let filteredExpenses = data;

      if (month) {
        const monthNum = parseInt(month, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          console.log("❌ Mes inválido. Usa un número entre 1 y 12.");
          return;
        }

        filteredExpenses = data.filter(expense => {
          const expenseMonth = new Date(expense.date).getMonth() + 1; // 0-11 → 1-12
          return expenseMonth === monthNum;
        });

        if (filteredExpenses.length === 0) {
          console.log(`No hay gastos registrados para el mes ${monthNum}.`);
          return;
        }
      }

      const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      console.log(`🧾 Total de gastos${month ? ` en el mes ${month}` : ""}: $${total.toFixed(2)}`);

    } catch (error) {
      console.error("❌ Error al leer el archivo de gastos:", error.message);
    }
  });


program.parse(process.argv);
