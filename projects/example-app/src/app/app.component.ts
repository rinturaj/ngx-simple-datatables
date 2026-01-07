import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ColumnConfig } from "../../../ngx-simple-datatables/src/interfaces/column-config.interface";
import { CommonModule } from "@angular/common";
import { NgxSimpleDatatablesModule } from "../../../ngx-simple-datatables/src/public-api";

@Component({
    selector: "app-root",
    imports: [NgxSimpleDatatablesModule, CommonModule],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.css"
})
export class AppComponent {
  title = "example-app";
  columns: ColumnConfig[] = [
    {
      field: "id",
      header: "ID",
      width: "80px",
      freeze: "left",
      sortable: true,
    },
    {
      field: "name",
      header: "Name",
      width: "200px",
      freeze: "left",
      sortable: true,
    },
    { field: "email", header: "Email", width: "250px", sortable: true },
    { field: "phone", header: "Phone", width: "150px", sortable: true },
    { field: "company", header: "Company", width: "200px", sortable: true },
    { field: "position", header: "Position", width: "180px", sortable: true },
    {
      field: "salary",
      header: "Salary",
      width: "120px",
      sortable: true,
      formatter: (value: { toLocaleString: () => any }) =>
        `$${value?.toLocaleString()}`,
    },
    {
      field: "department",
      header: "Department",
      width: "150px",
      sortable: true,
    },
    { field: "location", header: "Location", width: "150px", sortable: true },
    {
      field: "startDate",
      header: "Start Date",
      width: "120px",
      sortable: true,
      formatter: (value: string | number | Date) =>
        new Date(value).toLocaleDateString(),
    },
    {
      field: "status",
      header: "Status",
      width: "100px",
      sortable: true,
    },
    { field: "actions", header: "Actions", width: "120px" },
  ];

  data: any[] = [];

  constructor() {
    this.generateLargeDataset();
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
    ];
    const companies = [
      "TechCorp",
      "DataSys",
      "CloudInc",
      "WebSoft",
      "AppDev",
      "CodeLab",
      "DevStudio",
      "TechFlow",
    ];
    const positions = [
      "Developer",
      "Designer",
      "Manager",
      "Analyst",
      "Engineer",
      "Consultant",
      "Specialist",
      "Director",
    ];
    const departments = [
      "Engineering",
      "Design",
      "Marketing",
      "Sales",
      "HR",
      "Finance",
      "Operations",
      "Support",
    ];
    const locations = [
      "New York",
      "San Francisco",
      "London",
      "Tokyo",
      "Berlin",
      "Sydney",
      "Toronto",
      "Amsterdam",
    ];
    const statuses = ["Active", "Inactive", "Pending", "On Leave"];

    // Generate 10,000 rows for performance testing
    for (let i = 1; i <= 10000; i++) {
      this.data.push({
        id: i,
        name: names[Math.floor(Math.random() * names.length)],
        email: `user${i}@example.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(
          4,
          "0"
        )}`,
        company: companies[Math.floor(Math.random() * companies.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        salary: Math.floor(Math.random() * 150000) + 50000,
        department: departments[Math.floor(Math.random() * departments.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        startDate: new Date(
          2020 + Math.floor(Math.random() * 4),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1
        ),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        actions: "Edit | Delete",
      });
    }
  }
}
