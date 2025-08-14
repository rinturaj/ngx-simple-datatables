import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { DynamicTableComponent, type ColumnConfig } from "../src/lib"

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, DynamicTableComponent],
  template: `
    <div class="app-container">
      <h1>Dynamic Table Example</h1>
      <div class="table-wrapper">
        <lib-dynamic-table
          [columns]="columns"
          [data]="data"
          [rowHeight]="40"
          [headerHeight]="50">
        </lib-dynamic-table>
      </div>
    </div>
  `,
  styles: [
    `
    .app-container {
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .table-wrapper {
      height: 600px;
      margin-top: 20px;
    }
    
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
  `,
  ],
})
export class AppComponent {
  columns: ColumnConfig[] = [
    { field: "id", header: "ID", width: "80px", freeze: "left", sortable: true },
    { field: "name", header: "Name", width: "200px", freeze: "left", sortable: true },
    { field: "email", header: "Email", width: "250px", sortable: true },
    { field: "phone", header: "Phone", width: "150px", sortable: true },
    { field: "company", header: "Company", width: "200px", sortable: true },
    { field: "position", header: "Position", width: "180px", sortable: true },
    {
      field: "salary",
      header: "Salary",
      width: "120px",
      sortable: true,
      formatter: (value) => `$${value?.toLocaleString()}`,
    },
    { field: "department", header: "Department", width: "150px", sortable: true },
    { field: "location", header: "Location", width: "150px", sortable: true },
    {
      field: "startDate",
      header: "Start Date",
      width: "120px",
      sortable: true,
      formatter: (value) => new Date(value).toLocaleDateString(),
    },
    { field: "status", header: "Status", width: "100px", freeze: "right", sortable: true },
    { field: "actions", header: "Actions", width: "120px", freeze: "right" },
  ]

  data: any[] = []

  constructor() {
    this.generateLargeDataset()
  }

  private generateLargeDataset() {
    const names = [
      "John Doe",
      "Jane Smith",
      "Bob Johnson",
      "Alice Brown",
      "Charlie Wilson",
      "Diana Davis",
      "Eve Miller",
      "Frank Garcia",
    ]
    const companies = ["TechCorp", "DataSys", "CloudInc", "WebSoft", "AppDev", "CodeLab", "DevStudio", "TechFlow"]
    const positions = [
      "Developer",
      "Designer",
      "Manager",
      "Analyst",
      "Engineer",
      "Consultant",
      "Specialist",
      "Director",
    ]
    const departments = ["Engineering", "Design", "Marketing", "Sales", "HR", "Finance", "Operations", "Support"]
    const locations = ["New York", "San Francisco", "London", "Tokyo", "Berlin", "Sydney", "Toronto", "Amsterdam"]
    const statuses = ["Active", "Inactive", "Pending", "On Leave"]

    // Generate 10,000 rows for performance testing
    for (let i = 1; i <= 10000; i++) {
      this.data.push({
        id: i,
        name: names[Math.floor(Math.random() * names.length)],
        email: `user${i}@example.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        company: companies[Math.floor(Math.random() * companies.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        salary: Math.floor(Math.random() * 150000) + 50000,
        department: departments[Math.floor(Math.random() * departments.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        startDate: new Date(
          2020 + Math.floor(Math.random() * 4),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1,
        ),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        actions: "Edit | Delete",
      })
    }
  }
}
