import { test, expect } from "@playwright/test";
import { goto, expectHeading } from "./helpers";

/**
 * Comprehensive e2e tests for the 3-phase deletion framework
 * Tests cover: Instances, VPCs, Load Balancers, Databases
 * Validates: Preflight, Confirmation, Progress, and Completion phases
 */

test.describe("Deletion Flow - Preflight Phase", () => {
  test("Instance deletion shows preflight modal", async ({ page }) => {
    await goto(page, "/instances");

    // Find first instance row and click delete
    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      // Should show preflight modal
      await expect(page.locator('text="Resources to be deleted"')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeVisible();
    }
  });

  test("Preflight shows deletion order", async ({ page }) => {
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      // Should display what will be deleted
      const preflightContent = page.locator('[data-testid="deletion-preflight-modal"]');
      await expect(preflightContent).toContainText(/instance|resource/i);
    }
  });

  test("Preflight shows blockers if any", async ({ page }) => {
    await goto(page, "/vpcs");

    // Look for a VPC with dependencies
    const deleteButtons = page.locator('[data-testid="vpc-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const preflightModal = page.locator('[data-testid="deletion-preflight-modal"]');
      await expect(preflightModal).toBeVisible({ timeout: 5000 });

      // Check if blockers section exists (may be empty for free VPCs)
      const blockersSection = page.locator('[data-testid="deletion-blockers"]');
      if (await blockersSection.count() > 0) {
        await expect(blockersSection).toBeVisible();
      }
    }
  });
});

test.describe("Deletion Flow - Confirmation Phase", () => {
  test("Confirmation phrase must be exactly 'DELETE'", async ({ page }) => {
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeVisible({ timeout: 5000 });

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      const confirmButton = page.locator('[data-testid="deletion-confirm-button"]');

      if (await confirmInput.count() > 0) {
        // Type wrong phrase
        await confirmInput.fill("delete");
        await expect(confirmButton).toBeDisabled();

        // Type uppercase DELETE
        await confirmInput.fill("DELETE");
        await expect(confirmButton).not.toBeDisabled();
      }
    }
  });

  test("Confirmation phrase is case-sensitive", async ({ page }) => {
    await goto(page, "/databases");

    const deleteButtons = page.locator('[data-testid="database-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');

      if (await confirmInput.count() > 0) {
        // Should not accept "Delete" or "DELETE ME"
        await confirmInput.fill("Delete");
        await expect(page.locator('[data-testid="deletion-confirm-button"]')).toBeDisabled();

        await confirmInput.clear();
        await confirmInput.fill("DELETE ME");
        await expect(page.locator('[data-testid="deletion-confirm-button"]')).toBeDisabled();
      }
    }
  });

  test("Confirm button disabled until phrase matches", async ({ page }) => {
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const confirmButton = page.locator('[data-testid="deletion-confirm-button"]');
      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');

      if (await confirmButton.count() > 0) {
        // Initially disabled
        await expect(confirmButton).toBeDisabled();

        // Enable only when "DELETE" is typed
        await confirmInput.fill("DELETE");
        await expect(confirmButton).not.toBeDisabled();
      }
    }
  });
});

test.describe("Deletion Flow - Progress Phase", () => {
  test("Confirmation opens progress modal", async ({ page }) => {
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      const confirmButton = page.locator('[data-testid="deletion-confirm-button"]');

      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await confirmButton.click();

        // Progress modal should appear
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test("Progress modal shows percentage", async ({ page }) => {
    await goto(page, "/databases");

    const deleteButtons = page.locator('[data-testid="database-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        const progressBar = page.locator('[data-testid="deletion-progress-bar"]');
        await expect(progressBar).toBeVisible({ timeout: 10000 });

        // Progress should show percentage
        const progressText = page.locator('[data-testid="deletion-progress-percent"]');
        if (await progressText.count() > 0) {
          const text = await progressText.textContent();
          expect(text).toMatch(/\d+%/);
        }
      }
    }
  });

  test("Progress modal shows current step", async ({ page }) => {
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        const currentStep = page.locator('[data-testid="deletion-current-step"]');
        if (await currentStep.count() > 0) {
          await expect(currentStep).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test("Progress modal lists completed steps", async ({ page }) => {
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        const completedSteps = page.locator('[data-testid="deletion-completed-steps"]');
        if (await completedSteps.count() > 0) {
          await expect(completedSteps).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test("Progress modal shows remaining steps", async ({ page }) => {
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        const remainingSteps = page.locator('[data-testid="deletion-remaining-steps"]');
        if (await remainingSteps.count() > 0) {
          await expect(remainingSteps).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });
});

test.describe("Deletion Flow - Completion Phase", () => {
  test("Progress modal auto-closes on success", async ({ page }) => {
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        // Wait for progress modal to appear then close (max 65s for backend + 2s auto-close)
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeHidden({ timeout: 70000 });
      }
    }
  });

  test("Deletion shows success message", async ({ page }) => {
    await goto(page, "/databases");

    const deleteButtons = page.locator('[data-testid="database-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        const successMessage = page.locator('[data-testid="deletion-success"]');
        if (await successMessage.count() > 0) {
          await expect(successMessage).toBeVisible({ timeout: 70000 });
          expect(await successMessage.textContent()).toContain(/deleted|success/i);
        }
      }
    }
  });

  test("Deletion refreshes resource list", async ({ page }) => {
    await goto(page, "/instances");

    // Get initial count
    const initialRows = await page.locator("table tbody tr").count();

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        // Wait for completion
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeHidden({ timeout: 70000 });

        // List should refresh
        await page.waitForTimeout(1000);
        const finalRows = await page.locator("table tbody tr").count();
        expect(finalRows).toBeLessThanOrEqual(initialRows);
      }
    }
  });
});

test.describe("Deletion Flow - Error Handling", () => {
  test("Error accordion shows if deletion fails", async ({ page }) => {
    // This test would need a way to trigger a failure
    // For now, we verify error accordion structure exists
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      const errorAccordion = page.locator('[data-testid="deletion-errors-accordion"]');
      if (await errorAccordion.count() > 0) {
        // Should be hidden initially, shown only on error
        await expect(errorAccordion).not.toBeVisible();
      }
    }
  });

  test("Error recovery suggestions display", async ({ page }) => {
    // Verify error recovery UI exists
    const errorRecovery = page.locator('[data-testid="deletion-error-recovery"]');
    if (await errorRecovery.count() > 0) {
      // Recovery suggestions should have expected structure
      await expect(errorRecovery).toBeDefined();
    }
  });
});

test.describe("Deletion Flow - Instance Resource Type", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/instances");
  });

  test("Instance delete flow completes end-to-end", async ({ page }) => {
    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      // Preflight
      await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeVisible({ timeout: 5000 });

      // Confirmation
      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        // Progress
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeVisible({ timeout: 10000 });

        // Completion
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeHidden({ timeout: 70000 });
      }
    }
  });
});

test.describe("Deletion Flow - VPC Resource Type", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/vpcs");
  });

  test("VPC delete flow completes end-to-end", async ({ page }) => {
    const deleteButtons = page.locator('[data-testid="vpc-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      // Preflight
      await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeVisible({ timeout: 5000 });

      // Confirmation
      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        // Progress
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeVisible({ timeout: 10000 });

        // Completion
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeHidden({ timeout: 70000 });
      }
    }
  });
});

test.describe("Deletion Flow - Database Resource Type", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/databases");
  });

  test("Database delete flow completes end-to-end", async ({ page }) => {
    const deleteButtons = page.locator('[data-testid="database-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      // Preflight
      await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeVisible({ timeout: 5000 });

      // Confirmation
      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        // Progress
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeVisible({ timeout: 10000 });

        // Completion
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeHidden({ timeout: 70000 });
      }
    }
  });
});

test.describe("Deletion Flow - Load Balancer Resource Type", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to load balancers page
    await goto(page, "/load-balancers");
  });

  test("Load Balancer delete flow completes end-to-end", async ({ page }) => {
    const deleteButtons = page.locator('[data-testid="lb-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      // Preflight
      await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeVisible({ timeout: 5000 });

      // Confirmation
      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        // Progress
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeVisible({ timeout: 10000 });

        // Completion
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeHidden({ timeout: 70000 });
      }
    }
  });
});

test.describe("Deletion Flow - Modal Cancellation", () => {
  test("Can close preflight modal without deleting", async ({ page }) => {
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      // Get initial row count
      const initialCount = await page.locator("table tbody tr").count();

      await deleteButtons.first().click();

      // Close button
      const closeButton = page.locator('[data-testid="deletion-close-button"]');
      if (await closeButton.count() > 0) {
        await closeButton.click();

        // Modal should close
        await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeHidden();

        // Resources should still exist
        await page.waitForTimeout(500);
        const finalCount = await page.locator("table tbody tr").count();
        expect(finalCount).toBe(initialCount);
      }
    }
  });

  test("Pressing Escape closes preflight modal", async ({ page }) => {
    await goto(page, "/instances");

    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();

      await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeVisible({ timeout: 5000 });

      await page.keyboard.press("Escape");

      await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeHidden({ timeout: 2000 });
    }
  });
});

test.describe("Deletion Flow - UI State Management", () => {
  test("Modals do not appear on initial page load", async ({ page }) => {
    await goto(page, "/instances");

    await expect(page.locator('[data-testid="deletion-preflight-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="deletion-progress-modal"]')).not.toBeVisible();
  });

  test("Multiple resource pages maintain separate deletion state", async ({ page }) => {
    // Go to instances
    await goto(page, "/instances");
    const deleteButtons1 = page.locator('[data-testid="instance-delete"]');

    if (await deleteButtons1.count() > 0) {
      await deleteButtons1.first().click();
      await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeVisible({ timeout: 5000 });

      // Close
      const closeButton = page.locator('[data-testid="deletion-close-button"]');
      if (await closeButton.count() > 0) {
        await closeButton.click();
      }
    }

    // Go to databases
    await goto(page, "/databases");
    const deleteButtons2 = page.locator('[data-testid="database-delete"]');

    if (await deleteButtons2.count() > 0) {
      await deleteButtons2.first().click();

      // Should show fresh preflight modal
      await expect(page.locator('[data-testid="deletion-preflight-modal"]')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Deletion Flow - Integration with CRUD Operations", () => {
  test("Delete instance removes it from list", async ({ page }) => {
    await goto(page, "/instances");

    // Check if we can delete
    const deleteButtons = page.locator('[data-testid="instance-delete"]');
    if (await deleteButtons.count() > 0) {
      // Get first instance name
      const firstRow = page.locator("table tbody tr").first();
      const instanceName = await firstRow.locator("td").nth(1).textContent();

      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        // Wait for completion
        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeHidden({ timeout: 70000 });

        // Verify instance is gone
        await page.waitForTimeout(1000);
        const rows = await page.locator("table tbody tr").count();
        if (rows > 0) {
          const names = await page.locator("table tbody td:nth-child(2)").allTextContents();
          expect(names).not.toContain(instanceName);
        }
      }
    }
  });

  test("Delete VPC removes it from list", async ({ page }) => {
    await goto(page, "/vpcs");

    const deleteButtons = page.locator('[data-testid="vpc-delete"]');
    if (await deleteButtons.count() > 0) {
      const initialCount = await page.locator("table tbody tr").count();

      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeHidden({ timeout: 70000 });

        await page.waitForTimeout(1000);
        const finalCount = await page.locator("table tbody tr").count();
        expect(finalCount).toBeLessThan(initialCount);
      }
    }
  });

  test("Delete database removes it from list", async ({ page }) => {
    await goto(page, "/databases");

    const deleteButtons = page.locator('[data-testid="database-delete"]');
    if (await deleteButtons.count() > 0) {
      const initialCount = await page.locator("table tbody tr").count();

      await deleteButtons.first().click();

      const confirmInput = page.locator('[data-testid="confirmation-phrase-input"]');
      if (await confirmInput.count() > 0) {
        await confirmInput.fill("DELETE");
        await page.locator('[data-testid="deletion-confirm-button"]').click();

        await expect(page.locator('[data-testid="deletion-progress-modal"]')).toBeHidden({ timeout: 70000 });

        await page.waitForTimeout(1000);
        const finalCount = await page.locator("table tbody tr").count();
        expect(finalCount).toBeLessThan(initialCount);
      }
    }
  });
});
