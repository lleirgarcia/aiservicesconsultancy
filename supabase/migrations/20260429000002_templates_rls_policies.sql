-- Row-Level Security Policies for templates table
-- Ensures users can only access their own templates

-- Policy: Users can SELECT only their own templates
CREATE POLICY "Users can view their own templates"
ON templates
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can INSERT templates for themselves
CREATE POLICY "Users can create templates"
ON templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can UPDATE only their own templates
CREATE POLICY "Users can update their own templates"
ON templates
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE only their own templates
CREATE POLICY "Users can delete their own templates"
ON templates
FOR DELETE
USING (auth.uid() = user_id);
