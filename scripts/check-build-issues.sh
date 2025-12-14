#!/bin/bash

# Script to find potential build-time environment variable issues
# This checks for module-level client initializations that might fail during build

echo "🔍 Checking for module-level client initializations..."
echo ""

# Check for createClient at module level (not inside functions)
echo "📋 Files with 'createClient' at module level:"
grep -r "^const.*= createClient(" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "supabase/functions" | grep -v ".next" || echo "  ✅ None found"

echo ""
echo "📋 Files with 'new Resend' at module level:"
grep -r "^const.*= new Resend(" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "supabase/functions" | grep -v ".next" || echo "  ✅ None found"

echo ""
echo "📋 Files with 'new Stripe' at module level:"
grep -r "^const.*= new Stripe(" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "supabase/functions" | grep -v ".next" || echo "  ✅ None found"

echo ""
echo "📋 Client components that might need 'force-dynamic':"
grep -r "'use client'" --include="*.tsx" . | grep -v "node_modules" | grep -v ".next" | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  if ! grep -q "export const dynamic = 'force-dynamic'" "$file" 2>/dev/null; then
    # Check if file uses process.env at module level
    if grep -q "process\.env\." "$file" 2>/dev/null; then
      echo "  ⚠️  $file (uses process.env, consider adding force-dynamic)"
    fi
  fi
done

echo ""
echo "✅ Check complete!"

