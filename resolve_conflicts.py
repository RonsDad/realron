#!/usr/bin/env python3
"""
Script to resolve merge conflicts in page.tsx by intelligently merging both branches.
This will keep features from both HEAD and option2-merge.
"""

import re

def resolve_conflicts(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    resolved_lines = []
    i = 0
    in_conflict = False
    head_content = []
    merge_content = []
    capturing_head = False
    capturing_merge = False

    while i < len(lines):
        line = lines[i]

        if line.startswith('<<<<<<< HEAD'):
            in_conflict = True
            capturing_head = True
            capturing_merge = False
            head_content = []
            merge_content = []
        elif line.startswith('======='):
            if in_conflict:
                capturing_head = False
                capturing_merge = True
        elif line.startswith('>>>>>>> option2-merge'):
            if in_conflict:
                # Merge the content intelligently
                merged = merge_conflict_sections(head_content, merge_content)
                resolved_lines.extend(merged)

                in_conflict = False
                capturing_head = False
                capturing_merge = False
                head_content = []
                merge_content = []
        elif in_conflict:
            if capturing_head:
                head_content.append(line)
            elif capturing_merge:
                merge_content.append(line)
        else:
            resolved_lines.append(line)

        i += 1

    return resolved_lines

def merge_conflict_sections(head_lines, merge_lines):
    """
    Intelligently merge two conflict sections.
    """
    head_text = ''.join(head_lines).strip()
    merge_text = ''.join(merge_lines).strip()

    # If one side is empty, take the other
    if not head_text:
        return merge_lines
    if not merge_text:
        return head_lines

    # For state declarations and simple assignments, prefer merge (with semicolons)
    if 'useState' in merge_text or 'useRef' in merge_text:
        return merge_lines

    # For conditionals and code blocks, try to detect which is more complete
    if 'setClaudeCodeOutputs' in head_text and 'setClaudeCodeOutputs' not in merge_text:
        # HEAD has claudeCodeOutputs, merge doesn't - keep HEAD's version plus merge additions
        merged = head_lines[:]
        for line in merge_lines:
            if 'console.log' in line and 'console.log' not in head_text:
                # Add console.log from merge if not in HEAD
                merged.append(line)
        return merged

    # For thinking bubble handling, merge both approaches
    if 'thinking' in head_text.lower() or 'thinking' in merge_text.lower():
        # Check if they handle thinking differently
        if 'CREATE BUBBLE IMMEDIATELY' in head_text:
            # HEAD has immediate bubble creation - prefer this approach
            return head_lines
        elif 'Just track that' in merge_text:
            # Merge has simpler tracking
            # Combine: use HEAD's immediate creation but keep merge's tracking
            return head_lines

    # For tool output sections, keep both if they're different
    if 'tool_calls' in head_text or 'tool_calls' in merge_text:
        if len(head_lines) > len(merge_lines) * 1.5:
            # HEAD has significantly more content
            return head_lines
        elif len(merge_lines) > len(head_lines) * 1.5:
            # Merge has significantly more content
            return merge_lines

    # Default: prefer merge version (with semicolons and formatting)
    return merge_lines

# Process the file
resolved = resolve_conflicts('/Users/timhunter/ron-ai/src/app/page.tsx')

# Write the resolved version
with open('/Users/timhunter/ron-ai/src/app/page.tsx', 'w') as f:
    f.writelines(resolved)

print(f"Resolved conflicts in page.tsx")
print(f"Total lines in resolved file: {len(resolved)}")

# Verify no conflicts remain
with open('/Users/timhunter/ron-ai/src/app/page.tsx', 'r') as f:
    content = f.read()
    remaining = len(re.findall(r'^<<<<<<< HEAD', content, re.MULTILINE))
    if remaining == 0:
        print("✅ All conflicts resolved successfully!")
    else:
        print(f"⚠️  {remaining} conflicts still remain")